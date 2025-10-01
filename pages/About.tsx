import React from 'react';

const About: React.FC = () => {
  const headingStyle = "text-3xl font-bold mb-6 text-center text-habitica-light";

  return (
    <div className="max-w-4xl mx-auto bg-habitica-dark p-6 rounded-lg shadow-xl">
      
      <div className="pb-8">
        <h1 className={headingStyle}>About Habitica Backup + Task Importer</h1>
        <div className="space-y-4 text-habitica-text-secondary max-w-3xl mx-auto text-left">
          <p className="font-semibold">
            Habitica Backup + Task Importer is your insurance against account loss and a tool for sharing productivity systems.
          </p>
        </div>
      </div>

      <hr className="border-t-2 border-habitica-main opacity-50" />

      <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
            <h3 className="text-xl font-semibold text-white mb-2">🛡️ Create Backups</h3>
            <p className="text-habitica-text-secondary">Create a backup of all your Habits, Dailies, and Todos.</p>
        </div>
        <div>
            <h3 className="text-xl font-semibold text-white mb-2">🔄 Restore Everything</h3>
            <p className="text-habitica-text-secondary">Restore everything in case you lose access.</p>
        </div>
        <div>
            <h3 className="text-xl font-semibold text-white mb-2">📤 Share Your Best Practices</h3>
            <p className="text-habitica-text-secondary">Send the backup file to a friend so they can transfer your tasks to their account. You can pre-edit the backup so your friend only sees what you want them to see, and not your personal tasks you don't want to share.</p>
        </div>
      </div>

      <hr className="border-t-2 border-habitica-main opacity-50" />

      <div className="pt-8">
        <h2 className={headingStyle}>About the Developer</h2>
        <div className="space-y-4 text-habitica-text-secondary max-w-3xl mx-auto">
           <p>
              Hi! My name is <a href="https://habitica.com/profile/d5edea78-6f44-43d6-83ef-fc9da1cbcae2" target="_blank" rel="noopener noreferrer" className="text-habitica-light hover:underline">@hongweibing</a>.
          </p>
          <p>
              I am a big fan of Habitica, and I am trying to make the experience of using it even better. On <a href="https://storm-girdle-c18.notion.site/Useful-tools-for-Habitica-26486e08ea8a80f791bbd192356d3c6c" target="_blank" rel="noopener noreferrer" className="text-habitica-light hover:underline">this page</a>, I will post useful scripts, utilities, apps and other materials that may be useful to you. If you have any ready-made materials or ideas, you can write to me.
          </p>
          <p>
              You can also give me a couple of <span className="text-green-400 font-semibold">gems</span> if you find these materials useful :) But this is not necessary. The main thing is to develop yourself and achieve your goals!
          </p>
          <p>
              Good luck!
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;