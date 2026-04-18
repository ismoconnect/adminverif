import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function LiveVisitors() {
  const { admin } = useAdminAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Écoute en temps réel de la collection 'live_visitors'
    const q = query(
      collection(db, 'live_visitors'),
      orderBy('lastActiveAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitorsData = [];
      snapshot.forEach((doc) => {
        visitorsData.push({ id: doc.id, ...doc.data() });
      });
      setVisitors(visitorsData);
      setLoading(false);
      
      // Update selectedVisitor if its data changed
      setSelectedVisitor(prev => {
        if (prev) {
          const updated = visitorsData.find(v => v.id === prev.id);
          return updated || prev;
        }
        return prev;
      });
    }, (error) => {
      console.error("Erreur écoute visiteurs en direct: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (admin?.role !== 'super_admin') {
    return (
      <div className="p-8 text-center text-red-500 font-semibold">
        Accès refusé. Cette section est réservée aux super-administrateurs.
      </div>
    );
  }

  // Filtrer pour différencier actifs et inactifs avec une expiration de 2 minutes
  const activeVisitors = visitors.filter(v => {
    if (v.status !== 'active') return false;
    if (v.lastActiveAt && typeof v.lastActiveAt.toDate === 'function') {
      const lastActive = v.lastActiveAt.toDate();
      const diffMinutes = (currentTime - lastActive) / 1000 / 60;
      if (diffMinutes > 2) return false;
    }
    return true;
  });

  const inactiveVisitors = visitors.filter(v => {
    if (v.status === 'inactive') return true;
    if (v.status === 'active' && v.lastActiveAt && typeof v.lastActiveAt.toDate === 'function') {
      const lastActive = v.lastActiveAt.toDate();
      const diffMinutes = (currentTime - lastActive) / 1000 / 60;
      if (diffMinutes > 2) return true;
    }
    return false;
  });

  const getVisitorIdentity = (v) => {
    let name = `Anonyme (${v.id.substring(0, 4)})`;
    if (v.formData) {
      if (v.formData.firstName || v.formData.lastName) {
        name = `${v.formData.firstName || ''} ${v.formData.lastName || ''}`.trim();
      } else if (v.formData.email) {
        name = v.formData.email;
      }
    }
    if (v.visitCount && v.visitCount > 1) {
      return `${name} (Visite n°${v.visitCount})`;
    }
    return name;
  };

  const handleDeleteVisitor = async (v, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Voulez-vous vraiment supprimer cet enregistrement définitivement ?")) {
      try {
        await deleteDoc(doc(db, 'live_visitors', v.id));
        
        if (v.visitorId) {
          await deleteDoc(doc(db, 'visitor_stats', v.visitorId));
        }

        if (selectedVisitor?.id === v.id) {
          setSelectedVisitor(null);
        }
      } catch (err) {
        console.error("Erreur lors de la suppression", err);
        alert("Erreur lors de la suppression. Vérifiez vos permissions.");
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="relative flex h-4 w-4 mr-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
        </span>
        Visiteurs en Direct
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Liste des visiteurs */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-3 border-b pb-2 flex justify-between">
              Actifs en ce moment
              <span className="bg-green-100 text-green-700 py-0.5 px-2 rounded-full text-xs">
                {activeVisitors.length}
              </span>
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeVisitors.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Aucun visiteur actif</p>
              ) : (
                activeVisitors.map(v => (
                  <button 
                    key={v.id} 
                    onClick={() => setSelectedVisitor(v)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedVisitor?.id === v.id ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50 border-gray-100'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm truncate">{getVisitorIdentity(v)}</span>
                      <div className="flex items-center">
                        <span className="text-xs text-green-600 font-medium whitespace-nowrap ml-2">En ligne</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {v.formType || 'Page générale'}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate mt-1" title={v.userAgent}>
                      IP/Appareil: {v.userAgent ? v.userAgent.split(' ')[0] : 'Inconnu'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border border-gray-100 opacity-80 hover:opacity-100 transition-opacity">
            <h2 className="font-semibold text-gray-700 mb-3 border-b pb-2 flex justify-between">
              Historique récent
              <span className="bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                {inactiveVisitors.length}
              </span>
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {inactiveVisitors.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Aucun historique récent</p>
              ) : (
                inactiveVisitors.map(v => (
                  <button 
                    key={v.id} 
                    onClick={() => setSelectedVisitor(v)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${selectedVisitor?.id === v.id ? 'bg-gray-100 border-gray-300' : 'hover:bg-gray-50 border-gray-50'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-xs text-gray-600 truncate">{getVisitorIdentity(v)}</span>
                      <div className="flex items-center">
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2 mr-2">Parti</span>
                        <button 
                          onClick={(e) => handleDeleteVisitor(v, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                          title="Supprimer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">{v.formType || 'Page générale'}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Détails en temps réel du visiteur sélectionné */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl shadow p-6 border border-gray-100 min-h-[500px]">
          {selectedVisitor ? (
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-xl font-bold flex items-center">
                    Session: {selectedVisitor.id.substring(0, 8)}...
                    {selectedVisitor.status === 'active' && (
                      <span className="ml-3 relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Page actuelle : {selectedVisitor.formType || 'Général'}</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  User Agent:<br/>
                  <span className="truncate w-48 block">{selectedVisitor.userAgent}</span>
                </div>
              </div>

              {selectedVisitor.formData ? (
                <div className="bg-gray-50 rounded-lg p-5 font-mono text-sm shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                    <svg className="w-24 h-24 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  </div>
                  <div className="max-h-96 overflow-y-auto relative z-10 w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
                    <pre className="whitespace-pre-wrap text-gray-800">
                      {JSON.stringify(selectedVisitor.formData, null, 2)}
                    </pre>
                  </div>
                  
                  {selectedVisitor.status === 'active' && (
                    <div className="mt-4 flex items-center text-xs text-orange-500 animate-pulse font-sans">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Saisie en direct...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 italic flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                  Aucune donnée de formulaire capturée pour le moment...
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p>Sélectionnez un visiteur pour voir ce qu'il tape en ce moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
