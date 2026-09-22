import { Video, FileQuestion, BookOpen, ArrowLeft } from "lucide-react";

export default function FeatureCards({ onSelectFeature }) {
  const features = [
    {
      id: "lessons",
      icon: Video,
      title: "محاضرات وشروحات فيديو",
      desc: "شرح تفصيلي ومبسط لجميع أجزاء المنهج مع حل أفكار المستويات العليا.",
      accent: "from-cyan-500 to-blue-600",
      badge: "جودة HD تفاعلية",
      glow: "hover:border-cyan-500/50 hover:shadow-cyan-500/20",
      iconColor: "text-cyan-400",
      tagColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    },
    {
      id: "exams",
      icon: FileQuestion,
      title: "امتحانات وبنك أسئلة شامل",
      desc: "اختبارات دورية بنظام التابلت الحديث مع تصحيح تلقائي فوري وتفسير الإجابات.",
      accent: "from-indigo-500 to-purple-600",
      badge: "تصحيح تلقائي فوري",
      glow: "hover:border-indigo-500/50 hover:shadow-indigo-500/20",
      iconColor: "text-indigo-400",
      tagColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    },
    {
      id: "notes",
      icon: BookOpen,
      title: "مذكرات العميد وملخصات PDF",
      desc: "سلسلة مذكرات شاملة القوانين، الأفكار المتوقعة ونماذج الامتحانات للتحميل.",
      accent: "from-purple-500 to-pink-600",
      badge: "نسخ أصلية جاهزة للطباعة",
      glow: "hover:border-purple-500/50 hover:shadow-purple-500/20",
      iconColor: "text-purple-400",
      tagColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    },
  ];

  return (
    <section className="pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onSelectFeature(item.id)}
                className={`glass-panel p-6 relative group cursor-pointer transition-all duration-300 bg-slate-900/60 border border-white/10 rounded-2xl hover:-translate-y-1.5 shadow-lg ${item.glow}`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-slate-800/90 border border-white/10 flex items-center justify-center ${item.iconColor} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${item.tagColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors font-['Alexandria']">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                  {item.desc}
                </p>

                {/* Action Link */}
                <div className="flex items-center gap-1 text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                  <span>تصفح المحتوى الآن</span>
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform text-cyan-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
