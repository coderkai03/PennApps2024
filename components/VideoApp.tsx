"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Sun, Moon, User, Clapperboard, Edit, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HowItWorks from './HowItWorks';
import * as THREE from 'three';
import Lenis from '@studio-freight/lenis';
import { useTheme } from 'next-themes';
import { FeatureProps } from '@/lib/types';
import { useAuth } from '@/lib/auth'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Feature: React.FC<FeatureProps> = ({ title, description, icon }) => (
  <Card className="w-full md:w-1/3 m-2 dark:bg-gray-800">
    <CardHeader>
      <CardTitle className="flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>{description}</CardContent>
  </Card>
);

export default function SaasVideoLandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lenis = new Lenis();
      const raf = (time: number) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let particlesMesh: THREE.Points | null = null;

    const initThreeJs = () => {
      if (!canvasRef.current) return;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });

      renderer.setSize(window.innerWidth, window.innerHeight);

      // Create a particle system
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 5000;
      const posArray = new Float32Array(particlesCount * 3);

      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 5;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.005,
        color: theme === 'dark' ? 0xffffff : 0x4a90e2
      });

      particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particlesMesh);

      camera.position.z = 2;

      animate();
    }

    const animate = () => {
      if (!scene || !camera || !renderer || !particlesMesh) return;

      requestAnimationFrame(animate);
      particlesMesh.rotation.y += 0.001;
      renderer.render(scene, camera);
    };

    // Initialize Three.js immediately
    initThreeJs();

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      // Clean up Three.js resources
      if (renderer) {
        renderer.dispose();
      }
      if (particlesMesh) {
        particlesMesh.geometry.dispose();
        (particlesMesh.material as THREE.Material).dispose();
      }
    };
  }, [theme, mounted]);

  const scrollToVideoInput = () => {
    router.push('/videoscreen')
  };

  const handleAuthenticatedAction = () => {
    if (user) {
      scrollToVideoInput();
    } else if (isClient) {
      router.push('/login');
    }
  };

  if (!mounted || !isClient) return null;

  return (
    <>
      {/* {isLoading && <Loading onLoadingComplete={handleLoadingComplete} />} */}
      {isLoading && (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white dark:from-gray-900 dark:to-black text-black dark:text-white relative">
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
  
          {/* User Profile and Dark Mode Toggle */}
          <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
            {user && (
              <Link href="/dashboard">
                <Button variant="ghost" size="lg" className="rounded-full p-3">
                  <User className="h-6 w-6" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full p-3"
            >
              {theme === 'dark' ? <Sun className="h-6 w-6 text-yellow-400" /> : <Moon className="h-6 w-6 text-gray-700" />}
            </Button>
          </div>

          {/* Hero Section */}
          <section className="h-screen flex flex-col justify-center items-center text-center p-4 relative z-10">
          <div className="flex items-center mb-8">
            <Clapperboard className="text-purple-400 mr-4 w-[1em] h-[1em] text-[4rem] md:text-[6rem]" />
            <h1 className="text-4xl md:text-6xl font-bold sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Editly
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-20">Transform Your Personal Brand with AI</p>
          <Button onClick={handleAuthenticatedAction} className="text-lg py-6 px-8">
            {user ? "Get Started" : "Login to Get Started"}
          </Button>
          <ChevronDown className="mt-16 animate-bounce" size={48} />
          </section>

          {/* Features Section */}
          <section className="py-16 px-4 relative z-10">
            <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
            <div className="flex flex-wrap justify-center mt-10">
          <Feature
            title="Content Fusion"
            description="Seamlessly blend different types of content to create unique and engaging videos."
            icon={<Wand2 className="text-purple-500" />}
          />
          <Feature
            title="Automated Editing"
            description="Let our AI handle the editing process, saving you time and effort while ensuring professional results."
            icon={<Edit className="text-blue-500" />}
          />
        </div>
          </section>

          {/* How It Works Section */}
          <HowItWorks />

          {/* Testimonials Section
          <section className="py-16 px-4 relative z-10">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="flex flex-wrap justify-center">
              <Testimonial
                quote="This tool has revolutionized our video content strategy. Our viewers love the easy navigation!"
                author="Sarah Johnson"
                role="Content Manager at TechCorp"
              />
              <Testimonial
                quote="The time saved on manual chapter creation is incredible. It's a game-changer for our team."
                author="Michael Chen"
                role="YouTuber with 1M+ subscribers"
              />
              <Testimonial
                quote="The AI-generated chapters are surprisingly accurate. It's like having a smart assistant for all our videos."
                author="Emma Rodriguez"
                role="E-learning Director at EduOnline"
              />
            </div>
          </section> */}

          {/* Video Input Section
          <VideoScreen
            showVideoInput={showVideoInput}
            videoFile={videoFile}
            handleVideoUpload={handleVideoUpload}
            chapters={chapters}
            resetUpload={resetUpload} /> */}

          {/* Call to Action Section */}
          <section className="py-16 px-4 bg-black dark:bg-white text-white dark:text-black relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Videos?</h2>
              <p className="text-xl mb-8">Join thousands of content creators who are already benefiting from our AI-powered video chapters.</p>
              <Button onClick={scrollToVideoInput} className="text-lg py-6 px-8 bg-white text-black dark:bg-black dark:text-white hover:bg-blue-100">
                Upload Your First Video
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}