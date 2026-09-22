import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--cyan)' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.5rem' }}>الصفحة غير موجودة</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '1.5rem' }}>الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها</p>
      <Link to="/" className="btn-primary">
        <Home size={16} />
        <span>العودة للرئيسية</span>
      </Link>
    </div>
  );
}
