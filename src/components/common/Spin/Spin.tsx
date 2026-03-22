import './Spin.scss';

interface SpinProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
}

export function Spin({ size = 'default', tip }: SpinProps) {
  return (
    <div className={`spin-container spin-${size}`}>
      <div className="spin-icon">
        <i className="fas fa-spinner fa-spin"></i>
      </div>
      {tip && <div className="spin-tip">{tip}</div>}
    </div>
  );
}
