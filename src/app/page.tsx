"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Saved settings from devtools
const DEFAULT_CAMERA_Y_OFFSET = 8.13265306122449;
const DEFAULT_CAMERA_Z_OFFSET = 12.142857142857142;
const DEFAULT_CAMERA_LOOK_AT_OFFSET = 11.224489795918366;
const DEFAULT_SCROLL_SPEED_MULTIPLIER = 0.0001;

const HomePage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const [trackLength, setTrackLength] = useState(0);

    // State for handling stops and mini-tracks
    const [currentTrack, setCurrentTrack] = useState<'main' | 'mini1' | 'mini2' | 'mini3'>('main');
    const [stopIndex, setStopIndex] = useState<number | null>(null);
    const [canMove, setCanMove] = useState(true);

  useEffect(() => {
    let scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      renderer: THREE.WebGLRenderer,
      rollerCoasterGroup: THREE.Group,
      track: THREE.CatmullRomCurve3,
      cameraTarget: THREE.Vector3;

    // Saved settings or use defaults
    const savedYOffset = localStorage.getItem('cameraYOffset');
    const savedZOffset = localStorage.getItem('cameraZOffset');
    const savedLookAtOffset = localStorage.getItem('cameraLookAtOffset');
  
    const initialCameraYOffset = savedYOffset ? parseFloat(savedYOffset) : DEFAULT_CAMERA_Y_OFFSET;
    const initialCameraZOffset = savedZOffset ? parseFloat(savedZOffset) : DEFAULT_CAMERA_Z_OFFSET;
    const initialCameraLookAtOffset = savedLookAtOffset ? parseFloat(savedLookAtOffset) : DEFAULT_CAMERA_LOOK_AT_OFFSET;

    const stopPositions = [0.25, 0.5, 0.75]; // Example stop positions along the track

    const init = () => {
      if (!mountRef.current) return;
  
      // Scene
      scene = new THREE.Scene();
  
      // Camera
      camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
  
      // Initial camera position
      camera.position.set(0, 5, 0);
  
      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setClearColor(0xA9BA93, 1); // Light Green Background
      mountRef.current.appendChild(renderer.domElement);
  
      // Rollercoaster Track
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(10, 5, -10),
        new THREE.Vector3(20, 0, -20),
        new THREE.Vector3(30, 10, -30),
        new THREE.Vector3(40, 0, -40),
        new THREE.Vector3(50, 5, -50),
        new THREE.Vector3(50, 10, -60),
        new THREE.Vector3(40, 15, -70),
        new THREE.Vector3(30, 10, -80),
        new THREE.Vector3(20, 5, -70),
        new THREE.Vector3(10, 3, -60),
        new THREE.Vector3(0, 0, -50),
      ];
  
      track = new THREE.CatmullRomCurve3(points, true);
      const geometry = new THREE.TubeGeometry(track, 200, 0.5, 20, true);
      const material = new THREE.MeshBasicMaterial({ color: 0x1E3A28, side: THREE.DoubleSide }); // Dark Green Track
      const tube = new THREE.Mesh(geometry, material);
  
      // Camera Target
      cameraTarget = new THREE.Vector3();
  
      // Rollercoaster Car
      rollerCoasterGroup = new THREE.Group();
      rollerCoasterGroup.add(camera);
      scene.add(tube);
      scene.add(rollerCoasterGroup);
  
       // Start Marker (Head)
       const startMarkerGeometry = new THREE.BoxGeometry(1, 1, 1);
       const startMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000FF }); // Blue
       const startMarker = new THREE.Mesh(startMarkerGeometry, startMarkerMaterial);
       startMarker.position.copy(track.getPointAt(0));
       startMarker.rotation.copy(track.computeFrenetFrames(200, true).tangents[0]);
       scene.add(startMarker);
   
       // End Marker (Tail)
       const endMarkerGeometry = new THREE.BoxGeometry(1, 1, 1);
       const endMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 }); // Red
       const endMarker = new THREE.Mesh(endMarkerGeometry, endMarkerMaterial);
       endMarker.position.copy(track.getPointAt(1));
       endMarker.rotation.copy(track.computeFrenetFrames(200, true).tangents[199]);
       scene.add(endMarker);

      // Create stop markers
      stopPositions.forEach(stopPosition => {
          const stopGeometry = new THREE.ConeGeometry(1, 3, 32); // Cone as a stop marker
          const stopMaterial = new THREE.MeshBasicMaterial({ color: 0x50C878 }); // Bright Green
          const stopMarker = new THREE.Mesh(stopGeometry, stopMaterial);
          const stopPositionVector = track.getPointAt(stopPosition);
          stopMarker.position.copy(stopPositionVector);
          stopMarker.rotation.copy(track.computeFrenetFrames(200, true).tangents[Math.floor(stopPosition * 200)]);
          stopMarker.rotateX(Math.PI / 2); // Adjust rotation for cone
          scene.add(stopMarker);
      });
  
      // Track Length
      const calculatedTrackLength = track.getLength();
      setTrackLength(calculatedTrackLength);
      console.log('Track Length:', calculatedTrackLength);
    };
  
    const animate = () => {
      if (!mountRef.current) return;

      if (!canMove) {
          renderer.render(scene, camera);
          requestAnimationFrame(animate);
          return;
      }
  
      const looptime = 20;
      let t = (scrollRef.current % looptime) / looptime;

      // Check for stops
      if (currentTrack === 'main') {
          stopPositions.forEach((stopPosition, index) => {
              if (Math.abs(t - stopPosition) < 0.005) {
                  t = stopPosition; // Force exact stop
                  setStopIndex(index);
                  setCanMove(false);
                  scrollRef.current = stopPosition * looptime; // Ensure precise stopping
                  return; // Stop checking other positions once a stop is found
              }
          });
      }
  
      // Camera Position
      const position = track.getPointAt(t);
      camera.position.copy(position).add(new THREE.Vector3(0, initialCameraYOffset, initialCameraZOffset));
  
      // Camera Look At
      const lookAt = track.getPointAt((t + 0.01) % 1); // Look slightly ahead
      cameraTarget.copy(lookAt);
      cameraTarget.y += initialCameraLookAtOffset; // Adjust this value to look higher
  
      camera.lookAt(cameraTarget);
  
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
  
    const handleResize = () => {
      if (mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };
  
    const handleScroll = (e: WheelEvent) => {
        if (canMove) {
            scrollRef.current += e.deltaY * DEFAULT_SCROLL_SPEED_MULTIPLIER;
        }
    };

    const handleContinueClick = () => {
        setCanMove(true);
        setStopIndex(null);
        // Reset scrollRef to the current stop position to avoid jumps
        scrollRef.current = scrollRef.current;
    };

    const handleMiniTrackClick = (trackNumber: 1 | 2 | 3) => {
        setCurrentTrack(`mini${trackNumber}`);
        setCanMove(true);
        setStopIndex(null);
    };
  
    init();
    animate();
  
    window.addEventListener('resize', handleResize);
    window.addEventListener('wheel', handleScroll);

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', handleScroll);
    };
  }, []);

  return (
    <>
      <div style={{ height: '100vh', width: '100vw', position: 'relative' }} ref={mountRef} />
      {!canMove && stopIndex !== null && (
          <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '20px',
              borderRadius: '10px',
              zIndex: 10,
              textAlign: 'center'
          }}>
              <h2>Choice at Stop {stopIndex + 1}!</h2>
              <button onClick={handleContinueClick}>Continue</button>
              <p>Right click to enter mini-track {stopIndex + 1}.</p>
          </div>
      )}
      <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'black' }}>
            Track Length: {trackLength}
        </div>
    </>
  );
};

export default HomePage;
