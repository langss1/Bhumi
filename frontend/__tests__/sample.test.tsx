import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Sample component for demonstration
const SampleComponent = () => {
  return (
    <div>
      <h1>Welcome to Bhumi</h1>
      <button>Connect Wallet</button>
    </div>
  );
};

describe('SampleComponent', () => {
  it('renders the heading and button', () => {
    render(<SampleComponent />);
    
    expect(screen.getByRole('heading', { name: /Welcome to Bhumi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
  });
});
