"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const features = [
    {
        name: "Inventory Management",
        role: "Risk Manager, Global Bank",
        content: "This tool has revolutionized our credit assessment process. The AI-driven insights have significantly improved our decision-making accuracy."
    },
    {
        name: "Disaster Classification & Management",
        role: "CEO, FinTech Solutions",
        content: "The integration was seamless, and the results were immediate. Our loan approval process is now faster and more reliable than ever."
    },
    {
        name: "News",
        role: "Head of Credit, Regional Bank",
        content: "The regulatory compliance features give us peace of mind, while the risk scoring model helps us make better lending decisions."
    },
    {
        name: "Chatbot",
        role: "Head of Credit, Regional Bank",
        content: "The regulatory compliance features give us peace of mind, while the risk scoring model helps us make better lending decisions."
    }
];

const featureslider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);

    const resetTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
            if (!isPaused) {
                setCurrentIndex(prevIndex =>
                    prevIndex === features.length - 1 ? 0 : prevIndex + 1
                );
            }
        }, 5000);
    };

    useEffect(() => {
        resetTimer();
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isPaused]);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === features.length - 1 ? 0 : prevIndex + 1
        );
        resetTimer();
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? features.length - 1 : prevIndex - 1
        );
        resetTimer();
    };

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex);
        resetTimer();
    };

    return (
        <section id="features" className="py-16 bg-[var(--color-background)]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-teal-800 mb-3 font-sans">
                        Our Features
                    </h2>
                    <div className="w-20 h-1 bg-teal-800 mx-auto rounded-full"></div>
                </div>

                <div className="relative"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}>
                    
                    {/* Slider container - maintaining exact same dimensions */}
                    <div className="overflow-hidden rounded-2xl shadow-2xl">
                        <div className="relative">
                            <div
                                className="bg-teal-100 p-6 rounded-lg transition-all duration-500 border-l-4 border-teal-800 min-h-[300px] flex flex-col"
                                aria-live="polite"
                                aria-atomic="true"
                            >

                                <div className="flex flex-col items-center">
                                    <div className="text-center">
                                        <p className="font-bold text-[25px] text-gray-900 mb-2 font-sans">{features[currentIndex].name}</p>
                                    </div>
                                    <div className="h-1 w-16 bg-teal-500 rounded-full mb-4"></div>
                                </div>


                                <div className="flex flex-col items-center text-center">
                                    {/* <div className="flex mb-2">
                                        {[...Array(features[currentIndex].rating)].map((_, i) => (
                                            <Star key={i} className="h-6 w-6 text-[var(--color-golden)] fill-current mx-0.5" />
                                        ))}
                                    </div> */}
                                    

                                    <blockquote className="text-gray-800 text-lg md:text-xl mt-4 italic font-light leading-relaxed font-serif px-4">
                                        {features[currentIndex].content}
                                    </blockquote>
                                </div>

                                {/* Progress bar
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-teal-800">
                                    <div
                                        className="h-full bg-teal-600 transition-all duration-300 ease-linear"
                                        style={{
                                            width: `${((currentIndex + 1) / features.length) * 100}%`
                                        }}
                                    ></div>
                                </div> */}

                            </div>
                        </div>
                    </div>

                    {/* Navigation buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-10 md:-ml-16 p-2 rounded-full shadow-lg text-teal-800 hover:teal-100 focus:outline-none z-10 transition-all duration-300 transform hover:scale-110"
                        aria-label="Previous feature"
                    >
                        <ChevronLeft className="h-6 w-6 text-teal-800" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-10 md:-mr-16 p-2 rounded-full shadow-lg text-[var(--color-golden)] hover:bg-gray-50 focus:outline-none z-10 transition-all duration-300 transform hover:scale-110"
                        aria-label="Next feature"
                    >
                        <ChevronRight className="h-6 w-6 text-teal-800" />
                    </button>

                    {/* Slide indicators */}
                    <div className="flex justify-center mt-6">
                        {features.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-2 h-2 mx-1 rounded-full transition-all duration-300 focus:outline-none ${
                                    index === currentIndex ? 'bg-teal-800 w-4' : 'bg-teal-600'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default featureslider;