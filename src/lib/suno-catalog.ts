/**
 * The Know Show: user-created, noncommercial Suno soundtrack experiment.
 * The UUIDs were resolved from the 12 Suno share URLs on 2026-11-21.
 * Suno supplies audio via its cross-origin embed. No files are downloaded.
 */
export type SunoArrangement = {
  title: string;
  id: string;
  shareUrl: string;
};

export type SunoSoundtrack = {
  id: string;
  label: string;
  description: string;
  arrangements: readonly [SunoArrangement, SunoArrangement];
};

export const SUNO_SOUNDTRACKS: readonly SunoSoundtrack[] = [
  {
    id: "indie",
    label: "Indie / Dream Pop",
    description: "Lo-fi and indie-pop arrangements of Trivia Time Warp",
    arrangements: [
      { title: "LoFi v1", id: "159dd0aa-ac9c-41d5-b862-1119f6668c85", shareUrl: "https://suno.com/s/1OCPA9N3atIaCC1a" },
      { title: "LoFi v2", id: "0e4157a6-e096-4a01-aaed-922ae88f51fa", shareUrl: "https://suno.com/s/q9OqEpJqLjuFdpno" },
    ],
  },
  {
    id: "retro",
    label: "Retro 80s",
    description: "Synth-pop arrangements of Trivia Time Warp",
    arrangements: [
      { title: "80s v1", id: "35d82643-cbf4-4095-aae3-fc36708d2fcf", shareUrl: "https://suno.com/s/to8QJi7hcNuefyPn" },
      { title: "80s v2", id: "1ebd59a1-a6fd-4816-b018-d7574302a74c", shareUrl: "https://suno.com/s/cjsLsaAcE8q2fih1" },
    ],
  },
  {
    id: "jazz",
    label: "Cool Jazz",
    description: "Cool-jazz and swing arrangements",
    arrangements: [
      { title: "Jazz v1", id: "2afae0af-d4c2-4083-b04c-786736b8d499", shareUrl: "https://suno.com/s/bhbeSTs1lcZyxDPo" },
      { title: "Jazz v2", id: "75e66571-08aa-415c-a7b7-cdc4ea125cc1", shareUrl: "https://suno.com/s/xN0UChlljykGUwIR" },
    ],
  },
  {
    id: "game",
    label: "Classic Game Show",
    description: "Brassy, funky television-show arrangements",
    arrangements: [
      { title: "Game Show v1", id: "f94f7d91-f6c9-4b1d-a277-9a70a8dc0a01", shareUrl: "https://suno.com/s/QhkT9CVhRnEuZE2J" },
      { title: "Game Show v2", id: "37fd1a10-72cd-4e5c-86e2-b86def7daa6a", shareUrl: "https://suno.com/s/9mTaHv7yg9UuOhkL" },
    ],
  },
  {
    id: "bluegrass",
    label: "Bluegrass / Americana",
    description: "Acoustic bluegrass and Americana arrangements",
    arrangements: [
      { title: "Bluegrass v1", id: "54563d1a-0d6e-455a-8404-e664efdbe452", shareUrl: "https://suno.com/s/fitQZt3me3CJq1ug" },
      { title: "Bluegrass v2", id: "0a9f03f0-4cdf-4f5b-bd95-c36cf692f6e6", shareUrl: "https://suno.com/s/aLFXcnHkbqnECUcC" },
    ],
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Orchestral and cinematic arrangements",
    arrangements: [
      { title: "Cinematic v1", id: "c4f28060-6a1e-4dd9-bf89-31b01be9e789", shareUrl: "https://suno.com/s/adsmodPZpgxFphPf" },
      { title: "Cinematic v2", id: "ce63acc8-1e1a-4e59-9bcf-1096491014fb", shareUrl: "https://suno.com/s/8YODVGqGg3107c80" },
    ],
  },
];

export function sunoEmbedUrl(songId: string): string {
  return `https://suno.com/embed/${songId}`;
}
