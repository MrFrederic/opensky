import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2025 Dropzone Management System. Built with React and FastAPI.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
