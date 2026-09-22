import { useStudent } from '../context/StudentContext';
import { CheckCircle2 } from 'lucide-react';

export default function Toast() {
  const { toast } = useStudent();
  if (!toast) return null;

  return (
    <div className="toast-box">
      <CheckCircle2 size={20} style={{ color: 'var(--cyan)' }} />
      <span>{toast}</span>
    </div>
  );
}
