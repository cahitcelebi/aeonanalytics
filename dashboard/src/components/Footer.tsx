import React from 'react';

const Footer: React.FC = () => (
  <footer className="w-full py-4 px-6 mt-12 border-t bg-white text-gray-500 text-center text-sm">
    <span className="font-semibold text-gray-700">Aeon Analytics</span> &copy; {new Date().getFullYear()} &mdash; All rights reserved.
  </footer>
);

export default Footer; 