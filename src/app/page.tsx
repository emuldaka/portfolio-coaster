"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Button } from "@/components/ui/button";

// Saved settings from devtools
const DEFAULT_CAMERA_Y_OFFSET = 8.13265306122449;
const DEFAULT_CAMERA_Z_OFFSET = 12.142857142857142;
const DEFAULT_CAMERA_LOOK_AT_OFFSET = 11.224489795918366;
const DEFAULT_SCROLL_SPEED_MULTIPLIER = 0.0001;

const HomePage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

    // State for handling stops and mini-tracks
    const [currentTrack, setCurrentTrack] = useState<'main' | 'mini1' | 'mini2' | 'mini3'>('main');
    const [stopIndex, setStopIndex] = useState<number | null>(null);
    const [canMove, setCanMove] = useState(true);
    const [stopCoolDown, setStopCoolDown] = useState<number | null>(null);

  useEffect(() => {
    let scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      renderer: THREE.WebGLRenderer,
      rollerCoasterGroup: THREE.Group,
      track: THREE.CatmullRomCurve3,
      cameraTarget: THREE.Vector3,
      sun: THREE.DirectionalLight;

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

      // Lighting
      sun = new THREE.DirectionalLight(0xffffff, 1);
      sun.position.set(60, 100, 60);
      sun.castShadow = true;
      scene.add(sun);
  
      const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
      scene.add(ambientLight);

      // Create stop markers
      stopPositions.forEach((stopPosition, index) => {
          const stopPositionVector = track.getPointAt(stopPosition);
          const offset = 2; // Offset to the right
          const poleHeight = 5;
          const poleRadius = 0.2;
          const topSize = 0.5;

          // Street pole
          const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 32);
          const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Brown color
          const pole = new THREE.Mesh(poleGeometry, poleMaterial);
          pole.position.copy(stopPositionVector);
          pole.position.x += offset; // Offset to the right
          pole.position.y = stopPositionVector.y;
          scene.add(pole);

          // Text label for the stop
          const loader = new FontLoader();
          loader.load('/fonts/helvetiker_regular.typeface.json', function (font) {
              const textGeometry = new TextGeometry(`Stop ${index + 1}`, {
                  font: font,
                  size: 0.5,
                  height: 0.2,
              });
              const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
              const text = new THREE.Mesh(textGeometry, textMaterial);
              text.position.copy(stopPositionVector);
              text.position.x += offset + 1; // Shift to the right of the pole
              text.position.y += poleHeight; // Position above the pole
              scene.add(text);
          });
      });
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
                  handleStop(index)
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
       cameraTarget.y +=  initialCameraLookAtOffset; // Adjust this value to look higher
  
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
            scrollRef.current = Math.max(0, scrollRef.current); // Prevent reverse scrolling
        }
    };

    const handleContinueClick = () => {
         setCanMove(true);
         setStopIndex(null);
         setStopCoolDown(Date.now());
         scrollRef.current = Math.floor(scrollRef.current);
     };
 
     const handleStop = (index: number) => {
        if (stopCoolDown && Date.now() - stopCoolDown < 10000){
            return
        }
         setStopIndex(index);
         setCanMove(false);
         scrollRef.current = stopPositions[index] * 20 // Ensure precise stopping
         //scrollRef.current = Math.ceil(scrollRef.current);
      };
  
     const handleEnterClick = () => {
         setCanMove(true);
         setStopIndex(null);
         scrollRef.current = Math.ceil(scrollRef.current);
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
                 position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                 backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '10px',
                 zIndex: 10,
                 textAlign: 'center'
           }}>
               <h2>Choice at Stop {stopIndex + 1}!</h2>
               <Button onClick={() => {
                  setCanMove(true);
                  setStopIndex(null);
                  scrollRef.current = Math.ceil(scrollRef.current);
               }} style={{ backgroundColor: '#A9BA93', marginRight: '10px' }}>Continue</Button>
               <Button onClick={() => {console.log('enter');
               }} style={{ backgroundColor: '#A9BA93' }}>Enter</Button>
           </div>
       )}
     </>
   );
 };

 export default HomePage;
