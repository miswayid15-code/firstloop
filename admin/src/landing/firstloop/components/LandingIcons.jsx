import React from 'react';

/**
 * 01: Brand Control Icon (Swapped: Brand Tag with Magnifying Lens & Precision Gears)
 * Reference: Brand price tag connected by cord to loop with interlocking gear wheels
 */
export const BrandControlIcon = ({ className = "w-8 h-8", ...props }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Magnifying / Loop Frame */}
    <circle
      cx="24"
      cy="24"
      r="15"
      stroke="currentColor"
      strokeWidth="3.5"
    />

    {/* Primary Gear 1 (Upper Left) */}
    <g transform="translate(19, 19)">
      <circle cx="0" cy="0" r="2.2" fill="currentColor" />
      <circle cx="0" cy="0" r="4.8" stroke="currentColor" strokeWidth="2" />
      {/* Gear Teeth */}
      <path
        d="M0 -7V-4.8M0 4.8V7M-7 0H-4.8M4.8 0H7M-5 -5L-3.4 -3.4M3.4 3.4L5 5M-5 5L-3.4 3.4M3.4 -3.4L5 -5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>

    {/* Secondary Gear 2 (Lower Right) */}
    <g transform="translate(29, 28)">
      <circle cx="0" cy="0" r="1.8" fill="currentColor" />
      <circle cx="0" cy="0" r="3.8" stroke="currentColor" strokeWidth="1.8" />
      {/* Gear Teeth */}
      <path
        d="M0 -5.5V-3.8M0 3.8V5.5M-5.5 0H-3.8M3.8 0H5.5M-4 -4L-2.7 -2.7M2.7 2.7L4 4M-4 4L-2.7 2.7M2.7 -2.7L4 -4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </g>

    {/* Connecting Cord Loop */}
    <path
      d="M35 34C37 38.5 35 43.5 37 47C38 49 39.5 49.5 41.5 49.5"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Hanging Brand Tag */}
    <path
      d="M41 43.5L47 37.5L60 44.5L54.5 58L39.5 50.5L37.5 45.5L41 43.5Z"
      fill="currentColor"
    />

    {/* Tag Eyelet / Hole */}
    <circle
      cx="42.5"
      cy="45.5"
      r="2.2"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * 02: Fast Enrollment Icon
 * Reference: User profile silhouette with fast motion streaks and a plus + badge
 */
export const FastEnrollmentIcon = ({ className = "w-8 h-8", ...props }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Speed Motion Lines */}
    <path
      d="M17 23H23M6 30H19M12 37H22"
      stroke="currentColor"
      strokeWidth="4.2"
      strokeLinecap="round"
    />

    {/* User Head */}
    <circle
      cx="37"
      cy="19"
      r="8"
      fill="currentColor"
    />

    {/* User Torso */}
    <path
      d="M23 48.5C23 40.5 29.5 34 37 34C41.8 34 46.1 36.6 48.7 40.5C46.4 42.4 45 45.3 45 48.5V49H23V48.5Z"
      fill="currentColor"
    />

    {/* Add / Plus Badge Circle */}
    <circle
      cx="49"
      cy="45"
      r="10.5"
      fill="currentColor"
    />

    {/* Plus Symbol in Badge */}
    <path
      d="M49 39.5V50.5M43.5 45H54.5"
      stroke="#FFFFFF"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 03: Simple Stamping Icon
 * Reference: Desktop rubber stamp tool silhouette
 */
export const SimpleStampingIcon = ({ className = "w-8 h-8", ...props }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Top Handle Knob */}
    <circle
      cx="32"
      cy="18.5"
      r="10.5"
      fill="currentColor"
    />

    {/* Stamp Neck & Flaring Stem */}
    <path
      d="M27.5 27C27.5 32 23 38 17 42.5C14.5 44.5 13.5 45.5 13.5 47H50.5C50.5 45.5 49.5 44.5 47 42.5C41 38 36.5 32 36.5 27H27.5Z"
      fill="currentColor"
    />

    {/* Stamp Main Base Cushion */}
    <path
      d="M10 47.5C10 45 12 43 15 43H49C52 43 54 45 54 47.5V53H10V47.5Z"
      fill="currentColor"
    />

    {/* Stamp Lower Rubber Die Plate */}
    <rect
      x="12"
      y="56"
      width="40"
      height="4.5"
      rx="2"
      fill="currentColor"
    />
  </svg>
);

/**
 * 04: Clear Insights Icon (Swapped: Lightbulb with Jigsaw Puzzle Piece & Radiating Rays)
 * Reference: Lightbulb outline with radiating light rays and a puzzle piece inside
 */
export const ClearInsightsIcon = ({ className = "w-8 h-8", ...props }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Radiating Rays */}
    <path
      d="M32 4V9M12 14L16 17.5M52 14L48 17.5M4 31H9M55 31H60M12 48L16 44.5M52 48L48 44.5"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Lightbulb Outline */}
    <path
      d="M22 43C17.5 39.5 14 34.5 14 28C14 18.0589 22.0589 10 32 10C41.9411 10 50 18.0589 50 28C50 34.5 46.5 39.5 42 43V47C42 48.1046 41.1046 49 40 49H24C22.8954 49 22 48.1046 22 47V43Z"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Bulb Base & Contact */}
    <path
      d="M25 53H39M28 57H36M30 60H34"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
    />

    {/* Jigsaw Puzzle Piece inside Bulb */}
    <path
      d="M26 24H29.5C29.5 22.5 30.5 21.5 32 21.5C33.5 21.5 34.5 22.5 34.5 24H38V27.5C39.5 27.5 40.5 28.5 40.5 30C40.5 31.5 39.5 32.5 38 32.5V36H34.5C34.5 34.5 33.5 33.5 32 33.5C30.5 33.5 29.5 34.5 29.5 36H26V32.5C27.5 32.5 28.5 31.5 28.5 30C28.5 28.5 27.5 27.5 26 27.5V24Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
