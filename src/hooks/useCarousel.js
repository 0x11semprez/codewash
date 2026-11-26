import { useState } from 'react';
import { playActionCardLeft, playActionCardRight } from '../services/soundManager';

export const useCarousel = (battlingSkillId) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);

    const handleDragStart = (clientX) => {
        if (battlingSkillId) return;
        setIsDragging(true);
        setDragStartX(clientX);
    };

    const handleDragMove = (clientX) => {
        if (!isDragging || battlingSkillId) return;
        const diff = dragStartX - clientX;
        if (Math.abs(diff) >= 100) {
            if (diff > 0) {
                setSelectedIndex((p) => p + 1);
                playActionCardRight();
            } else {
                setSelectedIndex((p) => p - 1);
                playActionCardLeft();
            }
            setIsDragging(false);
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleCardClick = (offset) => {
        if (battlingSkillId || offset === 0) return;
        setSelectedIndex((p) => p + offset);
        if (offset > 0) {
            playActionCardRight();
        } else {
            playActionCardLeft();
        }
    };

    const navigateLeft = () => {
        setSelectedIndex((p) => p - 1);
        playActionCardLeft();
    };

    const navigateRight = () => {
        setSelectedIndex((p) => p + 1);
        playActionCardRight();
    };

    return {
        selectedIndex,
        isDragging,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        handleCardClick,
        navigateLeft,
        navigateRight,
    };
};
