import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { drawRect } from './utilities';
import { Box, Card } from '@mui/material';
import swal from 'sweetalert';
import { FaceMesh } from '@mediapipe/face_mesh';
import '@tensorflow/tfjs-backend-webgl';

export default function Home({ cheatingLog, updateCheatingLog }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const isProcessingRef = useRef(false);
  const smoothPoseRef = useRef({ yaw: 1, pitch: 1 });
  const [lastDetectionTime, setLastDetectionTime] = useState({});
  const [screenshots, setScreenshots] = useState([]);
  const awayFramesRef = useRef(0);
  const cooldownRef = useRef(false);
  const warningShownRef = useRef(false);

  // ================= CAPTURE & UPLOAD SCREENSHOT TO CLOUDINARY =================
  const captureScreenshotAndUpload = async (type) => {
    const video = webcamRef.current?.video;

    if (!video || video.readyState !== 4 || !canvasRef.current) {
      console.error('❌ Video or canvas not ready');
      return null;
    }

    try {
      // Capture screenshot from video
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg');

      // Upload to Cloudinary
      console.log('📤 Uploading screenshot to Cloudinary...');
      
      const formData = new FormData();
      formData.append('file', dataUrl);
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', process.env.REACT_APP_CLOUDINARY_CLOUD_NAME);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        console.log('✅ Uploaded to Cloudinary:', data.secure_url);

        const screenshot = {
          url: data.secure_url,
          type: type,
          detectedAt: new Date(),
        };

        // Update local screenshots state
        setScreenshots((prev) => [...prev, screenshot]);

        return screenshot;
      } else {
        console.error('❌ Cloudinary upload failed:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return null;
    }
  };

  // ================= FIX WASM CRASH =================
  useEffect(() => {
    window.onerror = function (message) {
      if (message && message.includes('abort')) {
        console.warn('MediaPipe WASM crash prevented');
        return true;
      }
    };

    return () => {
      window.onerror = null;
    };
  }, []);

  // ================= INIT SCREENSHOTS =================
  useEffect(() => {
    if (cheatingLog?.screenshots) {
      setScreenshots(cheatingLog.screenshots);
    }
  }, [cheatingLog]);

  // ================= INIT FACEMESH =================
  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 2,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);
    faceMeshRef.current = faceMesh;

    console.log('✅ FaceMesh initialized');

    return () => {
      faceMesh.close(); // important cleanup
    };
  }, []);

  // ================= HANDLE DETECTION =================
  const handleDetection = async (type) => {
    const now = Date.now();
    const lastTime = lastDetectionTime[type] || 0;

    if (now - lastTime < 3000) return;

    setLastDetectionTime(prev => ({ ...prev, [type]: now }));

    // Capture and upload screenshot
    const screenshot = await captureScreenshotAndUpload(type);

    if (screenshot) {
      // Update cheating log with new count and screenshot
      const updatedLog = {
        ...cheatingLog,
        [`${type}Count`]: (cheatingLog[`${type}Count`] || 0) + 1,
        screenshots: [...(cheatingLog.screenshots || []), screenshot],
      };

      updateCheatingLog(updatedLog);
    } else {
      // If screenshot upload failed, still update count
      const newCount = (cheatingLog[`${type}Count`] || 0) + 1;
      updateCheatingLog({
        ...cheatingLog,
        [`${type}Count`]: newCount,
      });
    }

    swal('Warning', `${type} detected`, 'warning');
  };

  const getHeadPose = (landmarks) => {
    const nose = landmarks[1];
    const left = landmarks[234];
    const right = landmarks[454];
    const top = landmarks[10];
    const bottom = landmarks[152];

    const distLeft = Math.abs(nose.x - left.x);
    const distRight = Math.abs(right.x - nose.x);
    const yawRatio = distLeft / distRight;

    const distTop = Math.abs(nose.y - top.y);
    const distBottom = Math.abs(bottom.y - nose.y);
    const pitchRatio = distTop / distBottom;

    // ===== SMOOTHING =====
    const alpha = 0.85; // higher = smoother

    smoothPoseRef.current.yaw =
      alpha * smoothPoseRef.current.yaw + (1 - alpha) * yawRatio;

    smoothPoseRef.current.pitch =
      alpha * smoothPoseRef.current.pitch + (1 - alpha) * pitchRatio;

    return {
      yaw: smoothPoseRef.current.yaw,
      pitch: smoothPoseRef.current.pitch,
    };
  };


  // ================= FACEMESH RESULTS =================
  const onResults = (results) => {
    if (cooldownRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ===== NO FACE =====
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      handleDetection('noFace');
      return;
    }

    // ===== MULTIPLE FACE =====
    if (results.multiFaceLandmarks.length > 1) {
      handleDetection('multipleFace');
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];

    const { yaw, pitch } = getHeadPose(landmarks);
    console.log("Yaw:", yaw.toFixed(2), "Pitch:", pitch.toFixed(2));

    console.log("Yaw:", yaw.toFixed(2), "Pitch:", pitch.toFixed(2));

    // ===== SAFE ZONE =====
    const isLookingAway =
      yaw < 0.6 || yaw > 1.4 ||
      pitch < 0.6 || pitch > 1.6;

    if (isLookingAway) {
      awayFramesRef.current++;
    } else {
      // ✅ RESET when user returns to normal
      awayFramesRef.current = 0;
      warningShownRef.current = false;
    }

    // trigger warning after continuous frames
    if (awayFramesRef.current > 5 && !warningShownRef.current) {
      warningShownRef.current = true;
      handleDetection('lookingAway');
      awayFramesRef.current = 0;
    }

    // ===== ONLY TRIGGER AFTER 5 CONTINUOUS FRAMES =====
    if (awayFramesRef.current > 8) {

      if (!warningShownRef.current) {
        swal('Warning', 'Please look at the screen', 'warning');
        warningShownRef.current = true;

        // 🔥 START COOLDOWN
        cooldownRef.current = true;
        setTimeout(() => {
          cooldownRef.current = false;
        }, 5000); // 5 sec cooldown

        awayFramesRef.current = 0;
        return;
      }

      handleDetection('lookingAway');

      // 🔥 START COOLDOWN
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 5000);

      awayFramesRef.current = 0;
      warningShownRef.current = false;
    }
  };
  // ================= DETECT =================
  const detect = async (net) => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) return;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 🔥 SAFE FACEMESH CALL
    if (faceMeshRef.current && !isProcessingRef.current) {
      isProcessingRef.current = true;

      try {
        await faceMeshRef.current.send({ image: video });
      } catch (err) {
        console.error('FaceMesh error:', err);
      }

      isProcessingRef.current = false;
    }

    // ================= COCO =================
    const obj = await net.detect(video);
    const ctx = canvas.getContext('2d');
    drawRect(obj, ctx);

    obj.forEach(el => {
      if (el.class === 'cell phone') handleDetection('cellPhone');
      if (el.class === 'book' || el.class === 'laptop') {
        handleDetection('prohibitedObject');
      }
    });
  };

  // ================= LOAD MODEL =================
  const runCoco = async () => {
    await tf.setBackend('webgl');
    await tf.ready();

    const net = await cocossd.load();
    console.log('✅ COCO loaded');

    const id = setInterval(() => detect(net), 500);
    return id;
  };

  // ================= INIT =================
  useEffect(() => {
    let id;
    runCoco().then(interval => (id = interval));

    return () => {
      if (id) clearInterval(id);
    };
  }, []);

  return (
    <Box>
      <Card sx={{ position: 'relative' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          muted
          videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
          style={{ width: '100%' }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
          }}
        />
      </Card>
    </Box>
  );
}