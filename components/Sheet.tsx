"use client";

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end animate-fadeIn"
      style={{ background: "rgba(10,10,8,0.6)" }}
    >
      <div className="flex-1 w-full" onClick={onClose} />
      <div
        className="w-full max-w-[480px] bg-card border border-border-strong border-b-0 rounded-t-[22px] px-6 pt-[18px] pb-[26px] max-h-[88vh] overflow-auto animate-riseIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-[38px] h-1 rounded bg-border-faint mx-auto mb-[18px]" />
        {children}
      </div>
    </div>
  );
}
