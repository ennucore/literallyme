import time
import argparse
import os
import globalsz

from cli import parser

args = {}
for name, value in vars(parser.parse_args()).items():
    args[name] = value

width, height = 480, 480
globalsz.width, globalsz.height = int(width), int(height)

if args['batch'] and not args['batch'].endswith(".mp4"):
    args['batch'] += '.mp4'

if args['extract_output']:
    os.makedirs(args['extract_output'])

alpha = float(args['alpha'])
frame = None  # Initialize as None for tkinter compatibility
original_frame = None
swapped_frame = None

os.environ['OMP_NUM_THREADS'] = '1'
globalsz.args = args

NoneType = type(None)
import threading

if not args['fastload']:
    from plugins.codeformer_app_cv2 import inference_app as codeformer

globalsz.lowmem = args['lowmem']
from utils import *


class Simulate:
    def __init__(self, bbox, kps, det_score, embedding, normed_embedding):
        self.bbox = bbox
        self.kps = kps
        self.det_score = det_score
        self.embedding = embedding
        self.normed_embedding = normed_embedding


def get_source_face():
    if isinstance(globalsz.source_face, NoneType):
        try:
            globalsz.source_face = sorted(face_analysers[0].get(cv2.imread(args['face'])), key=lambda x: x.bbox[0])[0]
        except Exception as e:
            print(f"HUSTON, WE HAVE A PROBLEM. WE CAN'T DETECT THE FACE IN THE IMAGE YOU PROVIDED! ERROR: {e}")
    return globalsz.source_face


def start_swapper(sw):
    import pickle
    with open('ll.pkl', 'rb') as file:
        loaded_data = pickle.load(file)
    frame = face_swappers[sw].get(cv2.imread(args['face']), loaded_data, loaded_data, paste_back=True)
    return frame


def start_analyser(sw):
    x = sorted(face_analysers[sw].get(cv2.imread(args['face'])), key=lambda x: x.bbox[0])[0]
    return x


def startx():
    global face_swappers, face_analysers
    face_swappers, face_analysers = prepare_swappers_and_analysers(args)


if args['fastload']:
    tx = threading.Thread(target=startx)
    tx.start()

from tqdm import tqdm
from PIL import Image

if not args['lowmem']:
    if not args['fastload']:
        import tensorflow as tf

        prepare()

if not args['fastload']:
    if not globalsz.args['nocuda'] and not args['apple']:
        device = torch.device(0)
        gpu_memory_total = round(torch.cuda.get_device_properties(device).total_memory / 1024 ** 3,
                                 2)  # Convert bytes to GB


if not isinstance(args['target_path'], int):
    if args['target_path'].isdigit():
        args['target_path'] = int(args['target_path'])

adjust_x1, adjust_y1, adjust_x2, adjust_y2 = args['bbox_adjust'].split('x')
adjust_x1, adjust_y1, adjust_x2, adjust_y2 = int(adjust_x1), int(adjust_y1), int(adjust_x2), int(adjust_y2)

frame_index = 0
frame_move = 0


def face_analyser_thread(frame, sw):
    global alpha, codeformer
    original_frame = frame
    test1 = args['alpha'] != 0
    if test1:
        faces = face_analysers[sw].get(frame)
        bboxes = []
        for face in faces:
            if args['selective'] != '':
                a = target_embedding.normed_embedding
                b = face.normed_embedding
                _, allow = compute_cosine_distance(a, b, 0.75)
                if not allow:
                    continue
            bboxes.append(face.bbox)
            ttest1 = False
            if not args['no_faceswap'] and (ttest1 or args['cli']):
                frame = face_swappers[sw].get(frame, face, get_source_face(), paste_back=True)

            test1 = False
            test2 = False
            if (test1 and test2) or (
                    args['face_enhancer'] != 'none' and args['cli'] and args['face_enhancer'] != 'codeformer'):
                try:
                    i = face.bbox
                    x1, y1, x2, y2 = int(i[0]), int(i[1]), int(i[2]), int(i[3])
                    x1 = max(x1 - adjust_x1, 0)
                    y1 = max(y1 - adjust_y1, 0)
                    x2 = min(x2 + adjust_x2, int(width))
                    y2 = min(y2 + adjust_y2, int(height))
                    facer = frame[y1:y2, x1:x2]
                    if args['face_enhancer'] == 'gfpgan':
                        facex = restorer_enhance(facer)
                    elif args['face_enhancer'] == 'ffe' and not args['lowmem']:
                        facex = upscale_image(facer, load_generator())
                    elif args['face_enhancer'] == "gpfgan_onnx":
                        facex, _ = load_gfpganonnx().forward(facer)
                    elif args['face_enhancer'] == "real_esrgan":
                        facex = realesrgan_enhance(facer)
                    facex = cv2.resize(facex, ((x2 - x1), (y2 - y1)))
                    frame[y1:y2, x1:x2] = facex
                except Exception as e:
                    print(e)
        if args['face_enhancer'] == 'codeformer':
            if args['fastload']:
                from plugins.codeformer_app_cv2 import inference_app as codeformer
            frame = codeformer(frame, args['codeformer_background_enhance'], args['codeformer_face_upscale'],
                               args['codeformer_upscale'], float(args['codeformer_fidelity']),
                               args['codeformer_skip_if_no_face'])
        test1 = args['alpha'] != 1
        if test1:
            frame = merge_face(frame, original_frame, alpha)
        return bboxes, frame, original_frame
    return [], frame, original_frame


def get_embedding(face_image):
    try:
        return face_analysers[0].get(face_image)
    except IndexError:
        return None


def process_image(input_path, output_path, sw):
    image = cv2.imread(input_path)
    bbox, image, original_frame = face_analyser_thread(image, sw)
    test1 = False
    if test1 or (args['face_enhancer'] != 'none' and args['cli']):
        image = restorer_enhance(image)
    cv2.imwrite(output_path, image)


def just_preload_them(sw, frame):
    for i in range(int(args['threads'])):
        threading.Thread(target=load, args=(sw, frame)).start()


def load(sw, frame):
    faces = face_analysers[sw].get(frame)
    face = list(faces)[0]
    face_swappers[sw].get(frame, face, source_face, paste_back=True)


def source_face_creator(input_face):
    global source_face
    source_face = sorted(face_analysers[0].get(input_face), key=lambda x: x.bbox[0])[0]
    return source_face


def optimize_saver():
    import pickle
    x = face_analysers[0].get(cv2.imread(args['face']))[
        0]  # sorted(face_analysers[0].get(cv2.imread(args['face'])), key=lambda x: x.bbox[0])[0]
    ll = {}
    for key, value in x.items():
        ll[key] = value
    ll = Simulate(ll['bbox'], ll['kps'], ll['det_score'], ll['embedding'], ll['embedding'])
    with open('ll.pkl', 'wb') as file:
        pickle.dump(ll, file)
    with open('ll.pkl', 'rb') as file:
        loaded_data = pickle.load(file)
    frame = face_swappers[0].get(cv2.imread(args['face']), loaded_data, get_source_face(), paste_back=True)
    print('nice')
    exit()


def handle_image_processing(image_info, face_swappers, original_threads):
    for it, i in tqdm(enumerate(image_info)):
        threading.Thread(target=process_image,
                         args=(i[0], i[1], it % len(face_swappers))).start()
        while threading.active_count() > (int(args['threads']) + original_threads): # TODO args threads
            time.sleep(0.01)
    while threading.active_count() > original_threads:
        time.sleep(0.01)
    print("image processing finished")


def process_videos(caps: list, frame_index: int, frame_move, old_index):
    for cap, fps, width, height, out, name, file, frame_number in caps:
        count = -1
        frame_index = count
        with tqdm(total=frame_number) as progressbar:
            temp = []
            bbox = []
            start = time.time()
            old_index = 0
            while True:
                try:
                    if process_frame(cap, count, progressbar, temp):
                        break
                    manage_frame_index()
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                except KeyboardInterrupt:
                    break
                except Exception as e:
                    if "main thread is not in main loop" in str(e):
                        return
                    print(f"HUSTON, WE HAD AN EXCEPTION, PROCEED WITH CAUTION, SEND RICHARD THIS: {e}. Line 947")
            for i in temp:  # Handle remaining frames
                bbox, frame, original_frame = i.join()
                write_and_update_frame(out, frame, progressbar)
            out.release()
            cap.release()
            cv2.destroyAllWindows()
            # handle_audio(file)  # Assuming we have a function to handle audio


def process_frame(cap, count, progressbar, temp):
    global frame_index, old_index
    if runnable == 0 and ((not runnable and not args['cli']) or args['cli']):
        count += 1
        frame_index = count
        if count == 0:
            progressbar.reset()
        else:
            ret, frame = cap.read()
            if not ret:
                return True
        temp.append(ThreadWithReturnValue(target=face_analyser_thread, args=(frame, count % len(face_swappers))))
        temp[-1].start()
        if count % 1000 == 999:
            torch.cuda.empty_cache()
        if len(temp) < int(args['threads']) * len(face_swappers) and ret:
            return False
        while len(temp) >= int(args['threads']) * len(face_swappers):
            bbox, frame, original_frame = temp.pop(0).join()
    return False


def manage_frame_index():
    global frame_index, old_index
    if runnable:
        frame_index += frame_move
        if frame_index < 1:
            frame_index = 1
        elif frame_index > frame_number:
            frame_index = frame_number
        old_index = frame_index


def write_and_update_frame(out, frame, progressbar):
    if not runnable and (not runnable or args['cli']):
        out.write(frame)
    progressbar.update(1)

class ImageProcessor:
    def __init__(self):
        face_swappers, face_analysers = prepare_swappers_and_analysers(args)
        self.face_swappers = face_swappers
        self.face_analysers = face_analysers

    def process(self, target_path, output):
        images = [[target_path, output]] # same as prepare image list
        handle_image_processing(images, face_swappers, threading.active_count())

        caps = [create_cap(
            width=width,
            height=height,
            target_path=target_path,
            output=output
        )]

        runnable = False # TODO?

        process_videos(caps, frame_index, frame_move, old_index)


