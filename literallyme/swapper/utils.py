import os
import urllib.request
from tqdm import tqdm
import glob
from typing import List
import subprocess
import tempfile

TEMP_DIRECTORY = 'stickers/temp'
TEMP_VIDEO_FILE = 'temp.mp4'
output_video_encoder = 'libx264'
TEMP_FRAME_QUALITY, OUTPUT_VIDEO_QUALITY = 0, 35
os.makedirs(TEMP_DIRECTORY, exist_ok=True)


def conditional_download(download_directory_path: str, urls: List[str]) -> None:
    if not os.path.exists(download_directory_path):
        os.makedirs(download_directory_path)
    for url in urls:
        download_file_path = os.path.join(download_directory_path, os.path.basename(url))
        if not os.path.exists(download_file_path):
            request = urllib.request.urlopen(url)  # type: ignore[attr-defined]
            total = int(request.headers.get('Content-Length', 0))
            with tqdm(total=total, desc='Downloading', unit='B', unit_scale=True, unit_divisor=1024) as progress:
                urllib.request.urlretrieve(url, download_file_path,
                                           reporthook=lambda count, block_size, total_size: progress.update(
                                               block_size))  # type: ignore[attr-defined]


def resolve_relative_path(path: str) -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), path))


def get_temp_directory_path(target_path: str) -> str:
    target_name, _ = os.path.splitext(os.path.basename(target_path))
    target_directory_path = os.path.dirname(target_path)
    temp_dir = os.path.join(TEMP_DIRECTORY, target_directory_path, target_name)
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    return temp_dir


def run_ffmpeg(args: List[str]) -> bool:
    commands = ['ffmpeg', '-hide_banner']
    commands.extend(args)
    try:
        subprocess.check_output(commands, stderr=subprocess.STDOUT)
        return True
    except Exception:
        pass
    return False


def detect_fps(target_path: str) -> float:
    command = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of',
               'default=noprint_wrappers=1:nokey=1', target_path]
    output = subprocess.check_output(command).decode().strip().split('/')
    try:
        numerator, denominator = map(int, output)
        return numerator / denominator
    except Exception:
        pass
    return 30


def extract_frames(target_path: str, fps: float = 20) -> bool:
    temp_directory_path = get_temp_directory_path(target_path)
    temp_frame_quality = TEMP_FRAME_QUALITY * 31 // 100
    return run_ffmpeg(
        ['-hwaccel', 'auto', '-i', target_path, '-q:v', str(temp_frame_quality), '-pix_fmt', 'rgb24', '-vf',
         'fps=' + str(fps), os.path.join(temp_directory_path, '%04d.' + 'png')])


def get_temp_output_path(target_path: str, suffix: str) -> str:
    temp_directory_path = get_temp_directory_path(target_path)
    filename = TEMP_VIDEO_FILE
    if suffix:
        filename = os.path.splitext(filename)[0] + suffix + os.path.splitext(filename)[1]
    return os.path.join(temp_directory_path, filename)


def create_video(frames_path: str, output_path, fps: float = 20, suffix: str = '') -> (bool, str):
    output_video_quality = (OUTPUT_VIDEO_QUALITY + 1) * 51 // 100
    commands = ['-hwaccel', 'auto', '-r', str(fps), '-i',
                os.path.join(frames_path, '%04d.sw' + suffix + '.png'), '-c:v',
                output_video_encoder]
    if output_video_encoder in ['libx264', 'libx265', 'libvpx']:
        commands.extend(['-crf', str(output_video_quality)])
    if output_video_encoder in ['h264_nvenc', 'hevc_nvenc']:
        commands.extend(['-cq', str(output_video_quality)])
    commands.extend(['-pix_fmt', 'yuv420p', '-vf', 'colorspace=bt709:iall=bt601-6-625:fast=1', '-y', output_path])
    return run_ffmpeg(commands), output_path


def remove_frames(suffix: str) -> None:
    for file_path in glob.glob(os.path.join(TEMP_DIRECTORY, '*.sw' + suffix + '.png')):
        os.remove(file_path)


def get_temp_frame_paths(target_path: str) -> List[str]:
    temp_directory_path = get_temp_directory_path(target_path)
    return glob.glob((os.path.join(glob.escape(temp_directory_path), '*.' + 'png')))


def compress_video(input_path: str, max_size: int) -> str:
    output_path = tempfile.mktemp(suffix='.mp4')
    target_bitrate = (max_size * 8) // 10  # Aim for 80% of max size, convert to bits

    cmd = [
        'ffmpeg',
        '-i', input_path,
        '-c:v', 'libx264',
        '-crf', '23',
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-maxrate', f'{target_bitrate}k',
        '-bufsize', f'{target_bitrate*2}k',
        '-vf', 'scale=iw*min(1\,min(480/iw\,480/ih)):ih*min(1\,min(480/iw\,480/ih))',
        '-y', output_path
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print(f"Error compressing video: {e}")
        print(f"FFmpeg stderr: {e.stderr.decode()}")
        raise

    return output_path


def get_video_format(input_path: str) -> str:
    """
    Get the video format from the input path using ffprobe.
    
    Args:
        input_path (str): The path to the input video file.
    
    Returns:
        str: The video format as reported by ffprobe.
    """
    print('input:', input_path)
    cmd = [
        'ffprobe',
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=codec_name',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        input_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(result.stdout)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error getting video format: {e}")
        print(f"ffprobe stderr: {e.stderr}")
        return "unknown"
