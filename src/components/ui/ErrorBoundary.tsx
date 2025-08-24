import React, { Component, ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from "../../utils/styledHelpers";

// ============================================================================
// ERROR BOUNDARY COMPONENT
// Professional error handling with helpful messages and recovery options
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

const ErrorContainer = styled.div`
  padding: ${props => theme('spacing')['2xl']};
  text-align: center;
  background: ${props => theme('colors.surface1')};
  border: 1px solid ${props => theme('colors.border1')};
  border-radius: ${props => theme('borderRadius.lg')};
  margin: ${props => theme('spacing.lg')};
`;

const ErrorIcon = styled.div`
  font-size: ${props => theme('typography.fontSize')['3xl']};
  margin-bottom: ${props => theme('spacing.lg')};
  opacity: 0.6;
`;

const ErrorTitle = styled.h2`
  font-size: ${props => theme('typography.fontSize.xl')};
  font-weight: ${props => theme('typography.fontWeight.semibold')};
  color: ${props => theme('colors.text1')};
  margin-bottom: ${props => theme('spacing.sm')};
`;

const ErrorMessage = styled.p`
  font-size: ${props => theme('typography.fontSize.base')};
  color: ${props => theme('colors.text2')};
  margin-bottom: ${props => theme('spacing.lg')};
  line-height: ${props => theme('typography.lineHeight.relaxed')};
`;

const ErrorActions = styled.div`
  display: flex;
  gap: ${props => theme('spacing.md')};
  justify-content: center;
  flex-wrap: wrap;
`;

const RetryButton = styled.button`
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.lg')};
  background: ${props => theme('gradients.accent')};
  color: ${props => theme('colors.bg')};
  border: none;
  border-radius: ${props => theme('borderRadius.base')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  cursor: pointer;
  transition: ${props => theme('animations.buttonHover')};
  
  &:hover {
    background: ${props => theme('gradients.accentHover')};
    transform: translateY(-1px);
  }
`;

const ReloadButton = styled.button`
  padding: ${props => theme('spacing.sm')} ${props => theme('spacing.lg')};
  background: transparent;
  color: ${props => theme('colors.text2')};
  border: 1px solid ${props => theme('colors.border2')};
  border-radius: ${props => theme('borderRadius.base')};
  font-weight: ${props => theme('typography.fontWeight.medium')};
  cursor: pointer;
  transition: ${props => theme('animations.buttonHover')};
  
  &:hover {
    background: ${props => theme('colors.surface2')};
    color: ${props => theme('colors.text1')};
    border-color: ${props => theme('colors.border2')};
  }
`;

const ErrorDetails = styled.details`
  margin-top: ${props => theme('spacing.lg')};
  padding: ${props => theme('spacing.md')};
  background: ${props => theme('colors.surface2')};
  border-radius: ${props => theme('borderRadius.base')};
  text-align: left;
  font-family: ${props => theme('typography.fontFamily.mono')};
  font-size: ${props => theme('typography.fontSize.sm')};
  
  summary {
    cursor: pointer;
    font-weight: ${props => theme('typography.fontWeight.medium')};
    color: ${props => theme('colors.text2')};
    margin-bottom: ${props => theme('spacing.sm')};
  }
  
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    color: ${props => theme('colors.textMuted')};
    margin: 0;
    max-height: 200px;
    overflow-y: auto;
  }
`;

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'An unexpected error occurred';
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            {isDevelopment 
              ? errorMessage
              : 'The application encountered an error. Please try again or reload the page.'
            }
          </ErrorMessage>
          
          <ErrorActions>
            <RetryButton onClick={this.handleRetry}>
              Try Again
            </RetryButton>
            <ReloadButton onClick={this.handleReload}>
              Reload Page
            </ReloadButton>
          </ErrorActions>

          {isDevelopment && (this.state.error || this.state.errorInfo) && (
            <ErrorDetails>
              <summary>Error Details (Development)</summary>
              <pre>
                {this.state.error?.stack || ''}
                {this.state.errorInfo?.componentStack || ''}
              </pre>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Widget-specific error boundary
export const WidgetErrorBoundary: React.FC<{
  children: ReactNode;
  widgetName: string;
  fallback?: ReactNode;
}> = ({ children, widgetName, fallback }) => {
  const customFallback = fallback || (
    <ErrorContainer>
      <ErrorIcon>🔧</ErrorIcon>
      <ErrorTitle>{widgetName} Error</ErrorTitle>
      <ErrorMessage>
        This widget encountered an error. Other widgets should continue working normally.
      </ErrorMessage>
      <ErrorActions>
        <ReloadButton onClick={() => window.location.reload()}>
          Reload Application
        </ReloadButton>
      </ErrorActions>
    </ErrorContainer>
  );

  return (
    <ErrorBoundary 
      fallback={customFallback}
      onError={(error, errorInfo) => {
        console.error(`Widget[${widgetName}] Error:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};