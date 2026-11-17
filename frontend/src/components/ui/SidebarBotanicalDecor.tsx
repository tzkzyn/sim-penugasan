/**
 * Dekorasi motif daun botani lembut bernuansa biru untuk bagian bawah sidebar.
 * Bersifat murni dekoratif (pointer-events-none) tanpa memengaruhi tata letak atau fungsi menu.
 */
export const SidebarBotanicalDecor = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 bottom-0 z-0 overflow-hidden select-none"
  >
    <svg
      viewBox="0 0 280 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-full opacity-35"
    >
      {/* Daun besar kiri belakang */}
      <path
        d="M-20 245 C10 170, 55 125, 118 112 C95 165, 58 210, 12 245 Z"
        fill="#60A5FA"
        fillOpacity="0.42"
      />
      {/* Daun lengkung tengah */}
      <path
        d="M25 248 C50 182, 108 135, 178 130 C152 178, 104 218, 56 248 Z"
        fill="#93C5FD"
        fillOpacity="0.32"
      />
      {/* Daun ramping kanan */}
      <path
        d="M95 250 C120 198, 172 162, 232 168 C206 205, 165 230, 128 250 Z"
        fill="#38BDF8"
        fillOpacity="0.36"
      />
      {/* Ranting & daun kecil kiri */}
      <path
        d="M-10 140 C28 150, 55 180, 62 224 C24 212, -2 182, -10 140 Z"
        fill="#BAE6FD"
        fillOpacity="0.28"
      />
      {/* Tulang daun tipis */}
      <path
        d="M4 242 C36 184, 72 146, 112 118"
        stroke="#DBEAFE"
        strokeOpacity="0.4"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M48 244 C82 195, 126 156, 172 134"
        stroke="#E0F2FE"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M118 246 C150 206, 186 180, 224 170"
        stroke="#BAE6FD"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

