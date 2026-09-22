import { Award, CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import { TEACHER_INFO } from '../data/platformData';

export default function TeacherSection() {
  return (
    <section id="teacher-section" className="py-14 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Teacher Image Box */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute -inset-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-3xl blur-xl opacity-50"></div>
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 bg-slate-950 shadow-2xl">
                <img
                  src="/teacher.png"
                  alt="مستر محمد عبد الخالق"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Teacher Details */}
          <div className="lg:col-span-7 space-y-5 text-right">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>السيرة المهنية والخبرة الأكاديمية</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-['Alexandria'] leading-tight">
              الأستاذ / <span className="bg-gradient-to-l from-cyan-400 to-indigo-300 bg-clip-text text-transparent">محمد عبد الخالق</span>
            </h2>

            <p className="text-base text-indigo-300 font-semibold">
              {TEACHER_INFO.title}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              {TEACHER_INFO.experience}. على مدار مسيرته التعليمية ساهم في تخريج آلاف الطلاب المتفوقين والتحاقهم بكليات القمة (هندسة، حاسبات ومعلومات، علوم، بترول وتعدين)، معتمداً على أحدث الأساليب التربوية والتحليل المنطقي للمسائل.
            </p>

            {/* Features Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>شرح مبسط خطوة بخطوة</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>متابعة دورية مع ولي الأمر</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>بنك أسئلة مطابق لنظام التابلت</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>حل نماذج الامتحانات الوزارية</span>
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <a
                href={`https://wa.me/${TEACHER_INFO.contacts.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="btn-cyan text-xs sm:text-sm py-2.5 px-5 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                تواصل واتساب مع الدعم الفني والمستر
              </a>

              <a
                href={`tel:${TEACHER_INFO.contacts.phone}`}
                className="btn-secondary text-xs sm:text-sm py-2.5 px-5 rounded-xl font-medium flex items-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-indigo-400" />
                {TEACHER_INFO.contacts.phone}
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
