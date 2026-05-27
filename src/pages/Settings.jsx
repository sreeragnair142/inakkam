import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from '../redux/slices/themeSlice';
import { 
  Palette, 
  Bell, 
  Eye, 
  Shield, 
  Trash2, 
  Check, 
  Smartphone, 
  Globe 
} from 'lucide-react';

const Settings = () => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);

  // Local settings toggle states
  const [privacyToggles, setPrivacyToggles] = useState({
    incognito: false,
    hideAge: false,
    hideLocation: false,
    showOnlineStatus: true,
  });

  const [notificationToggles, setNotificationToggles] = useState({
    matches: true,
    messages: true,
    likes: false,
    spotlight: true,
  });

  const [distanceValue, setDistanceValue] = useState(25);

  const handlePrivacyToggle = (key) => {
    setPrivacyToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNotificationToggle = (key) => {
    setNotificationToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleThemeChange = (mode) => {
    dispatch(setTheme(mode));
  };

  const getContainerClass = () => {
    return 'bg-white text-bumble-charcoal border border-slate-200 shadow-sm';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 text-left">
      
      {/* 1. Theme Configuration Panel */}
      <div className={`${getContainerClass()} p-6 rounded-3xl space-y-4`}>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-bumble-yellow" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">Aesthetic Theme Settings</h3>
        </div>
        <p className="text-slate-500 text-xs leading-relaxed">
          Select the styling layout for your local app views.
        </p>
        
        {/* Buttons list */}
        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          {['light', 'dark', 'gradient-blend'].map((mode) => {
            const isSelected = themeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                  ${isSelected
                    ? 'bg-bumble-charcoal text-white border-transparent shadow-md'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
              >
                <span>{mode.replace('-', ' ')}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Privacy & Filters Panel */}
      <div className={`${getContainerClass()} p-6 rounded-3xl space-y-6`}>
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-bumble-charcoal" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">Discovery & Privacy Settings</h3>
        </div>

        {/* Discovery distance slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">Maximum Match Distance</span>
            <span className="text-bumble-yellow font-extrabold">{distanceValue} miles</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={distanceValue}
            onChange={(e) => setDistanceValue(parseInt(e.target.value))}
            className="w-full accent-bumble-yellow cursor-pointer h-1.5 bg-slate-200 rounded-full"
          />
        </div>

        {/* Privacy toggles list */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {[
            { key: 'incognito', label: 'Incognito Mode', desc: 'Only show your profile to connections you swiped right on first.' },
            { key: 'hideAge', label: 'Hide My Age', desc: 'Remove your age badge from discover cards.' },
            { key: 'hideLocation', label: 'Hide Location Coordinates', desc: 'Hide distance proximity indicators from matches.' },
            { key: 'showOnlineStatus', label: 'Active Status Ring', desc: 'Display a green dot when you are currently online.' },
          ].map((toggle) => (
            <div key={toggle.key} className="flex justify-between items-center gap-4">
              <div className="text-left max-w-md">
                <span className="text-sm font-bold block text-bumble-charcoal">{toggle.label}</span>
                <span className="text-xs text-slate-500 block mt-0.5">{toggle.desc}</span>
              </div>
              <button
                onClick={() => handlePrivacyToggle(toggle.key)}
                className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative shrink-0 cursor-pointer
                  ${privacyToggles[toggle.key] ? 'bg-bumble-yellow' : 'bg-slate-300'}`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform
                    ${privacyToggles[toggle.key] ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Notifications Panel */}
      <div className={`${getContainerClass()} p-6 rounded-3xl space-y-6`}>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-bumble-red" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-bumble-charcoal">Communication Alerts</h3>
        </div>

        <div className="space-y-4">
          {[
            { key: 'matches', label: 'New Spark Match Alert', desc: 'Receive real-time push alerts when you obtain a new swipe match.' },
            { key: 'messages', label: 'Inbound Chat Messages', desc: 'Get notified when a connection sends you a message.' },
            { key: 'likes', label: 'Likes Dashboard Count', desc: 'Notify me when someone likes my profile.' },
            { key: 'spotlight', label: 'Spotlight Trends', desc: 'Get updates when your profile is trending locally.' },
          ].map((toggle) => (
            <div key={toggle.key} className="flex justify-between items-center gap-4">
              <div className="text-left max-w-md">
                <span className="text-sm font-bold block text-bumble-charcoal">{toggle.label}</span>
                <span className="text-xs text-slate-500 block mt-0.5">{toggle.desc}</span>
              </div>
              <button
                onClick={() => handleNotificationToggle(toggle.key)}
                className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative shrink-0 cursor-pointer
                  ${notificationToggles[toggle.key] ? 'bg-bumble-yellow' : 'bg-slate-300'}`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform
                    ${notificationToggles[toggle.key] ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Danger Zone */}
      <div className={`${getContainerClass()} p-6 rounded-3xl space-y-4`}>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-600" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-rose-500">Security & Account Integrity</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-200 p-4 rounded-2xl bg-rose-50/50">
          <div className="text-left">
            <span className="text-sm font-bold block text-bumble-charcoal">Temporarily Deactivate Profile</span>
            <span className="text-xs text-slate-500 block mt-0.5">Pause your swiping discover card from entering other feeds.</span>
          </div>
          <button className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-300 text-rose-500 hover:bg-rose-50/80 transition-colors shrink-0 cursor-pointer">
            Pause Swipes
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-300 p-4 rounded-2xl bg-rose-50">
          <div className="text-left">
            <span className="text-sm font-bold block text-rose-600">Delete HoneyGlow Account</span>
            <span className="text-xs text-slate-500 block mt-0.5">Permanently scrub swipe logs, chats history, matches, and images.</span>
          </div>
          <button className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm">
            <Trash2 className="w-4 h-4" />
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default Settings;
