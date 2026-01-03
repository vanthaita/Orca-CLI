import Image from "next/image";

type IconProps = { className?: string };

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

export const InfoIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M12 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 7H12.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const BookIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 5.5C4 4.119 5.119 3 6.5 3H20V19H6.5C5.119 19 4 20.119 4 21.5V5.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M20 19V3" stroke="currentColor" strokeWidth="2" />
    <path d="M8 7H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 11H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const HelpIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M9.75 9.5C9.95 8.5 10.85 7.75 12 7.75C13.25 7.75 14.25 8.55 14.25 9.75C14.25 11.25 12.75 11.5 12.25 12.25C12 12.625 12 13 12 13.25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 17H12.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const DownloadIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M12 3V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M7 10L12 15L17 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const TerminalIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 6C4 4.895 4.895 4 6 4H18C19.105 4 20 4.895 20 6V18C20 19.105 19.105 20 18 20H6C4.895 20 4 19.105 4 18V6Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M7 9L10 12L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.5 15H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CopyIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M9 9C9 7.895 9.895 7 11 7H19C20.105 7 21 7.895 21 9V19C21 20.105 20.105 21 19 21H11C9.895 21 9 20.105 9 19V9Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M5 15H5C3.895 15 3 14.105 3 13V5C3 3.895 3.895 3 5 3H13C14.105 3 15 3.895 15 5V5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const PackageIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" />
    <path d="M20 6.5L12 12L4 6.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
