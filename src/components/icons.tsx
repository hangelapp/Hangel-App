import type { SVGProps } from 'react';

export function HangelLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,1.75A10.25,10.25,0,1,0,22.25,12,10.25,10.25,0,0,0,12,1.75ZM8.88,17.37V6.62h2.5V11h2.25V6.62h2.5V17.37h-2.5V12.87H11.38v4.5Z" />
    </svg>
  );
}
