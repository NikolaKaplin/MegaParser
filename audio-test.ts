import player from "sound-play";
import path from "path";

const audio = [
  {
    name: "sahur",
    path: "audio/sahur.mp3",
  },
  {
    name: "patapim",
    path: "audio/patapim.mp3",
  },
];

async function memePlayer() {
  for (let i = 0; i < audio.length; i++) {
    await player.play(path.join(__dirname, audio[i]!?.path), 1);
  }
}

memePlayer();
