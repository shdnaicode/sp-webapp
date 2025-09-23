function GitHubIcon({ className = "h-5 w-5" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M12 .5C5.648.5.5 5.648.5 12c0 5.088 3.292 9.4 7.865 10.92.575.104.786-.25.786-.557 0-.275-.01-1.004-.016-1.972-3.2.695-3.875-1.543-3.875-1.543-.523-1.33-1.278-1.685-1.278-1.685-1.044-.714.079-.699.079-.699 1.154.081 1.762 1.186 1.762 1.186 1.027 1.76 2.695 1.252 3.35.957.104-.744.401-1.252.73-1.54-2.555-.291-5.243-1.278-5.243-5.684 0-1.255.448-2.28 1.184-3.085-.119-.29-.513-1.463.112-3.05 0 0 .967-.31 3.166 1.18a10.98 10.98 0 0 1 2.883-.388c.979.005 1.966.132 2.884.388 2.198-1.49 3.164-1.18 3.164-1.18.627 1.587.233 2.76.114 3.05.737.805 1.183 1.83 1.183 3.085 0 4.416-2.693 5.39-5.256 5.676.412.353.78 1.046.78 2.108 0 1.522-.014 2.748-.014 3.123 0 .309.208.668.793.554C20.212 21.396 23.5 17.087 23.5 12 23.5 5.648 18.352.5 12 .5Z" clipRule="evenodd" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="nb-bar mt-auto bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-8 py-5 md:px-10 text-sm text-gray-700">
        <div className="font-medium">© 2025 Shindanai Sudprasert</div>
        <a
          href="https://github.com/shdnaicode/sp-webapp"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-gray-800 hover:text-black"
          aria-label="View project on GitHub"
        >
          <GitHubIcon />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </footer>
  );
}
