
# DJ Fusion Machine

## A professional music management application for FIRST Robotics Competition events

DJ Fusion Machine is an open-source application designed to bring professional DJ-like music management to FRC events when a human DJ is unavailable. It reproduces the music selection technique that is taught to FRC DJs in Michigan.

## Features

- Plays tracks from a default playlist in randomized order
- Interrupt the default playlist by pressing one of the playlist buttons
- Automatically returns to the default playlist after any track ends
- Prevents track repetition until all tracks in a playlist have been played once
- Smooth crossfading between tracks
- Track display with time information
- Volume control with mute function
- Simple, intuitive interface for event operation

## Usage Instructions

1. **Add Music**: Start by adding your music folders - each folder will become a separate playlist
2. **Set Default Playlist**: Choose which playlist should be the default (automatic after adding the first folder)
3. **Play Music**: Click on any playlist to start playing a random track from that folder
4. **Reset Playlist**: Click "Reset" on a playlist to reset its track history and allow repeating tracks
5. **Volume Control**: Use the volume slider or mute button to control playback volume
6. **Skip Track**: Use the next track button to skip to another random track

## Technical Details

DJ Fusion Machine is a browser-based application built using:

- React for the UI
- Web Audio API for audio processing and crossfading
- HTML5 File API for local music access

## For Developers

This project was built with Vite, TypeScript, React, and Tailwind CSS. To run the development server:

```sh
# Install dependencies
npm i

# Start development server
npm run dev
```

## License

This project is open-source and freely available for use at FIRST Robotics Competition events around Michigan and the rest of the world.
