import React from 'react';

interface MedicalCaduceusLogoProps {
  className?: string;
  color?: string;
}

/**
 * Official Medical Caduceus Logo matching the user's uploaded medical-logo.svg
 * Featuring:
 * - Round top sphere and central tapered staff
 * - Detailed feathered wings with flight feather divisions
 * - Twin serpents facing each other with forked tongues and 7 intertwining spiral loops
 */
export function MedicalCaduceusLogo({
  className = 'w-16 h-20 text-[#0f3562]',
  color
}: MedicalCaduceusLogoProps) {
  return (
    <svg
      viewBox="0 0 500 550"
      className={className}
      style={color ? { color } : undefined}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Left Wing Group with Detailed Feather Ribbons */}
        <g id="left-wing">
          {/* Main Solid Wing Body */}
          <path
            d="M 250 96
               C 232 106, 210 98, 200 84
               C 190 70, 145 42, 85 64
               C 50 77, 18 94, 2 112
               C 28 116, 56 118, 85 116
               C 62 126, 38 132, 16 136
               C 42 142, 70 144, 100 141
               C 78 152, 54 158, 30 162
               C 56 168, 85 170, 116 166
               C 92 178, 68 184, 46 188
               C 74 194, 104 195, 134 190
               C 112 201, 88 207, 66 211
               C 94 216, 124 216, 154 211
               C 134 222, 110 228, 88 232
               C 118 236, 148 234, 178 227
               C 160 238, 140 244, 120 248
               C 152 250, 182 246, 210 236
               C 228 228, 242 216, 250 200 Z"
            fill="currentColor"
          />

          {/* Internal Feather Vanes & Cutouts (Negative Space in White/Background) */}
          {/* Top Upper Wing Contour Cutout */}
          <path
            d="M 200 88
               C 208 98, 224 104, 246 98
               L 246 103
               C 220 110, 202 104, 194 92
               C 184 78, 142 50, 86 70
               C 54 81, 24 97, 8 114
               L 6 110
               C 24 92, 54 75, 86 65
               C 144 45, 186 74, 196 87 Z"
            fill="#ffffff"
          />

          {/* Feather Division Slits */}
          <path
            d="M 30 116 C 65 120, 115 118, 165 110 L 165 113 C 115 121, 65 123, 30 119 Z"
            fill="#ffffff"
          />
          <path
            d="M 45 138 C 80 142, 130 139, 180 128 L 180 131 C 130 142, 80 145, 45 141 Z"
            fill="#ffffff"
          />
          <path
            d="M 60 162 C 95 165, 145 160, 195 146 L 195 149 C 145 163, 95 168, 60 165 Z"
            fill="#ffffff"
          />
          <path
            d="M 75 186 C 110 188, 158 180, 205 162 L 205 165 C 158 183, 110 191, 75 189 Z"
            fill="#ffffff"
          />
          <path
            d="M 92 210 C 126 211, 170 200, 215 180 L 215 183 C 170 203, 126 214, 92 213 Z"
            fill="#ffffff"
          />
          <path
            d="M 112 232 C 145 231, 185 218, 224 196 L 224 199 C 185 221, 145 234, 112 235 Z"
            fill="#ffffff"
          />
        </g>

        {/* Snake Head with Tongue */}
        <g id="left-snake-head">
          {/* Head & Snout */}
          <path
            d="M 175 195
               C 188 182, 212 178, 228 186
               C 232 188, 235 192, 230 196
               C 222 201, 215 200, 206 205
               C 198 210, 185 212, 172 206
               C 168 202, 168 198, 175 195 Z"
            fill="currentColor"
          />
          {/* Eye spot */}
          <circle cx="218" cy="189" r="2" fill="#ffffff" />
          {/* Forked Tongue sticking out towards staff */}
          <path
            d="M 230 194
               L 242 195
               L 246 191
               M 242 195
               L 246 198"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </defs>

      {/* Top Sphere Knob */}
      <circle cx="250" cy="38" r="28" fill="currentColor" />

      {/* Central Staff / Rod */}
      <rect x="245.5" y="66" width="9" height="435" rx="2" fill="currentColor" />
      {/* Bottom needle/point */}
      <polygon points="245,500 255,500 250,535" fill="currentColor" />
      <polygon points="247,530 253,530 250,545" fill="currentColor" />

      {/* Symmetric Wings (Left & Mirrored Right) */}
      <use href="#left-wing" />
      <use href="#left-wing" transform="translate(500, 0) scale(-1, 1)" />

      {/* Twin Snake Heads facing staff */}
      <use href="#left-snake-head" />
      <use href="#left-snake-head" transform="translate(500, 0) scale(-1, 1)" />

      {/* 7-Loop Entwined Serpents Body */}
      {/* Snake Left Path */}
      <path
        d="M 172 205
           C 152 225, 154 260, 185 285
           C 220 310, 280 320, 280 345
           C 280 370, 220 380, 188 400
           C 158 420, 158 445, 188 465
           C 222 485, 278 495, 278 515
           C 278 528, 258 535, 250 538"
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Snake Right Path */}
      <path
        d="M 328 205
           C 348 225, 346 260, 315 285
           C 280 310, 220 320, 220 345
           C 220 370, 280 380, 312 400
           C 342 420, 342 445, 312 465
           C 278 485, 222 495, 222 515
           C 222 528, 242 535, 250 538"
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Snake Intertwining Spirals & Overlapping Segments to match medical-logo.svg */}
      <path
        d="M 172 205
           C 150 230, 160 268, 205 288
           C 255 310, 295 328, 295 352
           C 295 375, 250 395, 205 412
           C 170 425, 168 448, 200 464
           C 240 480, 285 498, 285 516
           C 285 528, 265 536, 250 538"
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M 328 205
           C 350 230, 340 268, 295 288
           C 245 310, 205 328, 205 352
           C 205 375, 250 395, 295 412
           C 330 425, 332 448, 300 464
           C 260 480, 215 498, 215 516
           C 215 528, 235 536, 250 538"
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />

      {/* Inner body channel lines giving the 3D coiled snake effect */}
      <path
        d="M 175 212
           C 158 232, 168 262, 210 282
           M 290 352
           C 290 370, 252 388, 210 405
           M 205 464
           C 242 478, 280 494, 280 512"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 325 212
           C 342 232, 332 262, 290 282
           M 210 352
           C 210 370, 248 388, 290 405
           M 295 464
           C 258 478, 220 494, 220 512"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
