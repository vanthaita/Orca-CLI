import Image from "next/image";

export const WindowsIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 88 88"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203L0 12.402zm35.67 33.529l.028 34.453L.028 75.48.016 46.12l35.654-.189zM87.984 5.228l-48.46 6.604-.016 34.332 48.492-.284-.016-40.652zM88 49.955l-.016 40.817-48.508-6.837-.028-34.254 48.552.274z" />
    </svg>
  );
};

export const LinuxIcon = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/linux.svg"
      alt="Linux"
      width={300}
      height={300}
      className={className}
    />
  );
};

export const MacIcon = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/mac.svg"
      alt="Mac"
      width={300}
      height={300}
      className={className}
    />
  );
};
