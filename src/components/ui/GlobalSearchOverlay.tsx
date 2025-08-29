import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../../utils/styledHelpers';
import { SearchResult, SearchCategory } from '../../hooks/useGlobalSearch';

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border2')};
  border-radius: ${props => theme('borderRadius.lg')};
  box-shadow: ${props => theme('shadows.widget')};
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
  
  opacity: ${props => props.$isOpen ? 1 : 0};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-8px)'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all 0.2s ease;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => theme('colors.surface2')};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => theme('colors.border2')};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${props => theme('colors.text2')};
  }
`;

const CategorySection = styled.div`
  padding: ${props => theme('spacing.md')};
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => theme('colors.border1')};
  }
`;

const CategoryHeader = styled.div`
  font-size: ${props => theme('typography.fontSize.xs')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.textMuted')};
  text-transform: uppercase;
  letter-spacing: ${props => theme('typography.letterSpacing.wider')};
  margin-bottom: ${props => theme('spacing.sm')};
  padding: 0 ${props => theme('spacing.sm')};
`;

const ResultItem = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => theme('spacing.md')};
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.md')};
  border-radius: ${props => theme('borderRadius.base')};
  cursor: pointer;
  transition: ${props => theme('transitions.fast')};
  
  background: ${props => props.$isSelected ? theme('colors.accentAlpha') : 'transparent'};
  color: ${props => props.$isSelected ? theme('colors.text1') : theme('colors.text2')};
  
  &:hover {
    background: ${props => theme('colors.accentAlpha')};
    color: ${props => theme('colors.text1')};
  }
`;

const ResultIcon = styled.div<{ $type: string }>`
  width: 24px;
  height: 24px;
  border-radius: ${props => theme('borderRadius.base')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  flex-shrink: 0;
  
  background: ${props => {
    if (props.$type === 'player') return theme('colors.accent');
    if (props.$type === 'page') return theme('colors.info');
    if (props.$type === 'filter') return theme('colors.warning');
    return theme('colors.textMuted');
  }};
  
  color: ${props => {
    if (props.$type === 'player') return 'white';
    if (props.$type === 'page') return 'white';
    if (props.$type === 'filter') return 'white';
    return theme('colors.text1');
  }};
`;

const ResultContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultTitle = styled.div`
  font-size: ${props => theme('typography.fontSize.sm')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ResultSubtitle = styled.div`
  font-size: ${props => theme('typography.fontSize.xs')};
  color: ${props => theme('colors.textMuted')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NoResults = styled.div`
  padding: ${props => theme('spacing.lg')};
  text-align: center;
  color: ${props => theme('colors.textMuted')};
  font-size: ${props => theme('typography.fontSize.sm')};
`;

const getResultIcon = (type: string, result: SearchResult) => {
  if (type === 'player') {
    return result.data?.position?.substring(0, 2) || '👤';
  }
  if (type === 'page') {
    return '📄';
  }
  if (type === 'filter') {
    return '🏷️';
  }
  return '?';
};

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  categories: SearchCategory[];
  onSelectResult: (result: SearchResult, navigate?: (path: string) => void) => void;
  onClose: () => void;
}

export default function GlobalSearchOverlay({ 
  isOpen, 
  categories, 
  onSelectResult, 
  onClose 
}: GlobalSearchOverlayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Flatten results for keyboard navigation
  const allResults = categories.flatMap(cat => cat.results);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allResults[selectedIndex]) {
            handleSelectResult(allResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allResults, selectedIndex, onClose]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [categories]);

  const handleSelectResult = (result: SearchResult) => {
    // Pass navigate function to the handler so it can be used for page navigation
    onSelectResult(result, navigate);
  };

  if (!isOpen) return null;

  return (
    <Overlay ref={overlayRef} $isOpen={isOpen}>
      {categories.length === 0 ? (
        <NoResults>No results found</NoResults>
      ) : (
        categories.map((category, categoryIndex) => {
          let resultOffset = 0;
          for (let i = 0; i < categoryIndex; i++) {
            resultOffset += categories[i].results.length;
          }

          return (
            <CategorySection key={category.type}>
              <CategoryHeader>{category.name}</CategoryHeader>
              {category.results.map((result, resultIndex) => {
                const globalIndex = resultOffset + resultIndex;
                const isSelected = globalIndex === selectedIndex;

                return (
                  <ResultItem
                    key={result.id}
                    $isSelected={isSelected}
                    onClick={() => handleSelectResult(result)}
                  >
                    <ResultIcon $type={result.type}>
                      {getResultIcon(result.type, result)}
                    </ResultIcon>
                    <ResultContent>
                      <ResultTitle>{result.title}</ResultTitle>
                      {result.subtitle && (
                        <ResultSubtitle>{result.subtitle}</ResultSubtitle>
                      )}
                    </ResultContent>
                  </ResultItem>
                );
              })}
            </CategorySection>
          );
        })
      )}
    </Overlay>
  );
}