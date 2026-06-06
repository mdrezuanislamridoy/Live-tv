import { useEffect } from 'react';
import { useTvStore } from '../store/useTvStore';

export function useTvNavigation() {
  const { tvMode, setTvMode, activeTab, setActiveTab, currentChannel, setCurrentChannel } = useTvStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Backspace', 'Escape'];
      if (!keys.includes(e.key)) return;

      // If keyboard arrow key is pressed, enable TV Mode (focus outlines)
      if (!tvMode && e.key.startsWith('Arrow')) {
        setTvMode(true);
        // Focus the first focusable element
        const first = document.querySelector('.focusable') as HTMLElement;
        if (first) first.focus();
        e.preventDefault();
        return;
      }

      if (!tvMode) return;

      const activeEl = document.activeElement as HTMLElement;
      
      // If we are currently typing in an input field (like Search bar), don't hijack left/right/enter arrow keys
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        if (e.key === 'Enter') {
          activeEl.blur(); // dismiss keyboard
          e.preventDefault();
        }
        if (e.key === 'Escape' || e.key === 'Backspace') {
          activeEl.blur();
          e.preventDefault();
        }
        // Let user navigate the text cursor inside inputs, unless it's Up/Down
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
          return;
        }
      }

      if (e.key === 'Enter') {
        if (activeEl && activeEl.classList.contains('focusable')) {
          activeEl.click();
          e.preventDefault();
        }
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Escape') {
        // Handle BACK navigation
        e.preventDefault();
        
        // If there's an active video player in full overlay, close it
        const closePlayerBtn = document.getElementById('close-player-btn');
        if (closePlayerBtn) {
          closePlayerBtn.click();
          return;
        }

        // If a modal is open, close it
        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) {
          closeModalBtn.click();
          return;
        }

        // Otherwise go to home tab
        if (activeTab !== 'home') {
          setActiveTab('home');
          setTimeout(() => {
            const first = document.querySelector('.focusable') as HTMLElement;
            if (first) first.focus();
          }, 50);
        }
        return;
      }

      // Spatial navigation algorithm
      const focusables = Array.from(document.querySelectorAll('.focusable')) as HTMLElement[];
      const visibleFocusables = focusables.filter(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0'
        );
      });

      if (visibleFocusables.length === 0) return;

      let currentRect = activeEl ? activeEl.getBoundingClientRect() : null;
      
      // If no active element or the active element is not focusable/visible, focus the first visible focusable
      if (!activeEl || !visibleFocusables.includes(activeEl) || !currentRect) {
        visibleFocusables[0].focus();
        e.preventDefault();
        return;
      }

      const activeCx = currentRect.left + currentRect.width / 2;
      const activeCy = currentRect.top + currentRect.height / 2;

      let bestCandidate: HTMLElement | null = null;
      let minScore = Infinity;

      for (const el of visibleFocusables) {
        if (el === activeEl) continue;

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = cx - activeCx;
        const dy = cy - activeCy;

        let isValidDirection = false;
        let score = 0;

        // Tweak spatial weight ratios. We penalize misalignment heavily.
        switch (e.key) {
          case 'ArrowUp':
            if (dy < -2) { // Allow tiny deviation
              isValidDirection = true;
              score = Math.abs(dy) * 1.2 + Math.abs(dx) * 4;
            }
            break;
          case 'ArrowDown':
            if (dy > 2) {
              isValidDirection = true;
              score = dy * 1.2 + Math.abs(dx) * 4;
            }
            break;
          case 'ArrowLeft':
            if (dx < -2) {
              isValidDirection = true;
              score = Math.abs(dx) * 1.2 + Math.abs(dy) * 4;
            }
            break;
          case 'ArrowRight':
            if (dx > 2) {
              isValidDirection = true;
              score = dx * 1.2 + Math.abs(dy) * 4;
            }
            break;
        }

        if (isValidDirection && score < minScore) {
          minScore = score;
          bestCandidate = el;
        }
      }

      if (bestCandidate) {
        bestCandidate.focus();
        
        // Smoothly scroll the element into view if contained inside a scrollable div
        bestCandidate.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
        
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Automatically turn off tvMode focus outlines if mouse is moved or clicked
    const handleMouseEvent = () => {
      if (tvMode) {
        setTvMode(false);
      }
    };

    window.addEventListener('mousedown', handleMouseEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseEvent);
    };
  }, [tvMode, setTvMode, activeTab, setActiveTab, currentChannel, setCurrentChannel]);
}
