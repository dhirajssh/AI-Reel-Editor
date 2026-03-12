from __future__ import annotations

from pathlib import Path

from app.services.ffmpeg import run_ffmpeg
from app.utils.timecode import seconds_to_ass_time


ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H00FFFFFF,&H0000FFFF,&H00111111,&H64000000,1,0,0,0,100,100,0,0,1,3,0,2,90,90,280,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def build_ass_file(output_path: str, caption_segments: list[dict]) -> str:
    lines = [ASS_HEADER]
    for segment in caption_segments:
        words = segment["words"]
        for index, word in enumerate(words):
            start = seconds_to_ass_time(word["start"])
            end = seconds_to_ass_time(word["end"])
            rendered_words = []
            for i, item in enumerate(words):
                if i == index:
                    rendered_words.append(r"{\c&H00FFFF&}" + escape_ass(item["word"]) + r"{\c&HFFFFFF&}")
                else:
                    rendered_words.append(escape_ass(item["word"]))
            line_text = " ".join(rendered_words)
            lines.append(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{line_text}")
    Path(output_path).write_text("\n".join(lines), encoding="utf-8")
    return output_path


def escape_ass(text: str) -> str:
    return text.replace("\\", r"\\").replace("{", r"\{").replace("}", r"\}")


def extract_audio(input_path: str, output_path: str) -> None:
    run_ffmpeg(["ffmpeg", "-y", "-i", input_path, "-vn", "-ac", "1", "-ar", "16000", output_path])


def normalize_to_vertical(input_path: str, output_path: str) -> None:
    filter_chain = (
        "scale=1080:1920:force_original_aspect_ratio=increase,"
        "crop=1080:1920,"
        "setsar=1"
    )
    run_ffmpeg(
        [
            "ffmpeg",
            "-y",
            "-i",
            input_path,
            "-vf",
            filter_chain,
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "20",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            output_path,
        ]
    )


def render_final_video(input_path: str, captions_path: str, output_path: str) -> None:
    absolute_captions = str(Path(captions_path).resolve())
    escaped_captions = (
        absolute_captions
        .replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace(",", "\\,")
        .replace("'", r"\'")
    )
    zoom_filter = (
        "scale=1188:2112,"
        "zoompan="
        "z='if(lte(on,30),1+0.0066667*on,if(lte(on,60),1.2-0.0066667*(on-30),1))':"
        "x='iw/2-(iw/zoom/2)':"
        "y='ih/2-(ih/zoom/2)':"
        "d=1:s=1080x1920:fps=30,"
        "ass=filename='{captions}'"
    ).format(captions=escaped_captions)
    run_ffmpeg(
        [
            "ffmpeg",
            "-y",
            "-i",
            input_path,
            "-vf",
            zoom_filter,
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "30",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            output_path,
        ]
    )
