import insightface
from .utils import resolve_relative_path, conditional_download, extract_frames, get_temp_frame_paths, create_video, remove_frames
import numpy
from queue import Queue
import threading
from typing import Any, List, Callable, Optional
from insightface.app.common import Face
from tqdm import tqdm
import psutil
from concurrent.futures import ThreadPoolExecutor, as_completed
import random
import cv2
import os
import pickle
import onnxruntime

Frame = numpy.ndarray[Any, Any]

FACE_ANALYSER = None
THREAD_LOCK = threading.Lock()
SIMILAR_FACE_DISTANCE = 0.85
print(onnxruntime.get_available_providers())
providers = ['CUDAExecutionProvider'] if 'CUDAExecutionProvider' in onnxruntime.get_available_providers() else None


def suggest_execution_threads() -> int:
    if 'CUDAExecutionProvider' in onnxruntime.get_available_providers():
        return 16
    return 8


EXECUTION_THREADS = suggest_execution_threads()


def get_face_analyser() -> Any:
    global FACE_ANALYSER

    with THREAD_LOCK:
        if FACE_ANALYSER is None:
            FACE_ANALYSER = insightface.app.FaceAnalysis(name='buffalo_l')
            FACE_ANALYSER.prepare(ctx_id=0, det_thresh=0.2, det_size=(256, 256))
    return FACE_ANALYSER


def get_one_face(frame: Frame, position: int = 0) -> Optional[Face]:
    many_faces = get_many_faces(frame)
    if many_faces:
        try:
            return many_faces[position]
        except IndexError:
            return many_faces[-1]
    return None


def get_many_faces(frame: Frame) -> Optional[List[Face]]:
    try:
        return get_face_analyser().get(frame)
    except ValueError:
        return None


def find_similar_face(frame: Frame, reference_face: Face) -> Optional[Face]:
    many_faces = get_many_faces(frame)
    if many_faces:
        for face in many_faces:
            if hasattr(face, 'normed_embedding') and hasattr(reference_face, 'normed_embedding'):
                distance = numpy.sum(numpy.square(face.normed_embedding - reference_face.normed_embedding))
                if distance < SIMILAR_FACE_DISTANCE:
                    return face
    return None


FACE_SWAPPER = None
THREAD_LOCK = threading.Lock()
NAME = 'ROOP.FACE-SWAPPER'


def pre_check() -> bool:
    download_directory_path = resolve_relative_path('../models')
    conditional_download(download_directory_path,
                         ['https://huggingface.co/CountFloyd/deepfake/resolve/main/inswapper_128.onnx'])
    return True


def get_face_swapper() -> Any:
    global FACE_SWAPPER

    with THREAD_LOCK:
        if FACE_SWAPPER is None:
            model_path = resolve_relative_path('../models/inswapper_128.onnx')
            FACE_SWAPPER = insightface.model_zoo.get_model(model_path, providers=providers)
    return FACE_SWAPPER


def multi_process_frame(source_path: str, temp_frame_paths: List[str],
                        process_frames: Callable[[str, List[str], Any, str], None], update: Callable[[], None],
                        suffix: str = '') -> None:
    with ThreadPoolExecutor(max_workers=EXECUTION_THREADS) as executor:
        futures = []
        queue = create_queue(temp_frame_paths)
        queue_per_future = max(len(temp_frame_paths) // EXECUTION_THREADS, 1)
        while not queue.empty():
            future = executor.submit(process_frames, source_path, pick_queue(queue, queue_per_future), update, suffix)
            futures.append(future)
        for future in as_completed(futures):
            future.result()


def process_video(source_path: str, frame_paths: list[str],
                  process_frames: Callable[[str, List[str], Any, str], None], suffix: str = '') -> None:
    progress_bar_format = '{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}{postfix}]'
    total = len(frame_paths)
    with tqdm(total=total, desc='Processing', unit='frame', dynamic_ncols=True,
              bar_format=progress_bar_format) as progress:
        multi_process_frame(source_path, frame_paths, process_frames, lambda: update_progress(progress), suffix)


def swap_face(source_face: Face, target_face: Face, temp_frame: Frame) -> Frame:
    return get_face_swapper().get(temp_frame, target_face, source_face, paste_back=True)


def process_frame(source_face: Face, temp_frame: Frame, save_face: str = '') -> Frame:
    if os.path.exists(save_face):
        with open(save_face, 'rb') as f:
            try:
                target_face = pickle.load(f)
            except:
                target_face = get_one_face(temp_frame)
    else:
        target_face = get_one_face(temp_frame)
    if save_face and target_face:
        with open(save_face, 'wb') as f:
            pickle.dump(target_face, f)
    if target_face:
        temp_frame = swap_face(source_face, target_face, temp_frame)
    return temp_frame


def process_frames(source_path: str, temp_frame_paths: List[str], update: Callable[[], None], suffix: str = '') -> None:
    source_face = get_one_face(cv2.imread(source_path))
    for temp_frame_path in temp_frame_paths:
        if '.sw' in temp_frame_path:
            continue
        temp_frame = cv2.imread(temp_frame_path)
        result = process_frame(source_face, temp_frame, temp_frame_path.replace('.png', '.face'))
        cv2.imwrite(temp_frame_path.replace('.png', '.sw' + suffix + '.png'), result)
        if update:
            update()


def update_progress(progress: Any = None) -> None:
    process = psutil.Process(os.getpid())
    memory_usage = process.memory_info().rss / 1024 / 1024 / 1024
    progress.set_postfix({
        'memory_usage': '{:.2f}'.format(memory_usage).zfill(5) + 'GB',
        'execution_threads': EXECUTION_THREADS
    })
    progress.refresh()
    progress.update(1)


def create_queue(temp_frame_paths: List[str]) -> Queue[str]:
    queue: Queue[str] = Queue()
    for frame_path in temp_frame_paths:
        queue.put(frame_path)
    return queue


def pick_queue(queue: Queue[str], queue_per_future: int) -> List[str]:
    queues = []
    for _ in range(queue_per_future):
        if not queue.empty():
            queues.append(queue.get())
    return queues


def fully_process_video(input_path: str, target_path: str):
    pre_check()
    extract_frames(target_path)
    frame_paths = get_temp_frame_paths(target_path)
    print(f'Extracted {len(frame_paths)} frames, first one is {frame_paths[0]}')
    suffix = f'.{random.randint(0, 1000000)}'
    process_video(input_path, frame_paths, process_frames, suffix=suffix)
    vid = create_video(target_path, suffix=suffix)[1]
    remove_frames(suffix)
    return vid
