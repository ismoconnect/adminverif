import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
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

  const [lastUpdatedKey, setLastUpdatedKey] = useState(null);
  const [prevData, setPrevData] = useState({});

  useEffect(() => {
    if (selectedVisitor?.formData) {
      const currentData = selectedVisitor.formData;
      // Trouver la clé qui a changé
      const changedKey = Object.keys(currentData).find(key => 
        JSON.stringify(currentData[key]) !== JSON.stringify(prevData[key])
      );
      
      if (changedKey) {
        setLastUpdatedKey(changedKey);
        // Reset l'ombrage après 2 secondes
        const timer = setTimeout(() => setLastUpdatedKey(null), 2000);
        setPrevData(currentData);
        return () => clearTimeout(timer);
      }
      setPrevData(currentData);
    }
  }, [selectedVisitor?.formData]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';
    const date = timestamp.toDate();
    const diffSeconds = Math.floor((currentTime - date) / 1000);
    
    if (diffSeconds < 60) return `À l'instant`;
    if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)} min`;
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const DataRenderer = ({ data, parentKey = '' }) => {
    if (!data || typeof data !== 'object') return <span className="text-slate-900 font-semibold">{String(data)}</span>;

    const renderValue = (val, fullKey) => {
      if (Array.isArray(val)) {
        return (
          <div className="space-y-3 mt-2">
            {val.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-black text-blue-600 uppercase mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Élément #{idx + 1}
                </div>
                <DataRenderer data={item} parentKey={`${fullKey}.${idx}`} />
              </div>
            ))}
          </div>
        );
      }
      if (typeof val === 'object' && val !== null) {
        return <DataRenderer data={val} parentKey={fullKey} />;
      }
      return <span className="text-slate-900 font-semibold">{String(val)}</span>;
    };

    // Trier les clés pour éviter les sauts aléatoires
    const sortedEntries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));

    return (
      <div className="grid grid-cols-1 gap-1">
        {sortedEntries.map(([key, value]) => {
          // On n'affiche pas les valeurs null/undefined, mais on affiche les chaînes vides
          // pour garder la place dans le layout et éviter les "sauts".
          if (value === null || value === undefined) return null;
          
          const isUpdating = lastUpdatedKey === key;
          
          return (
            <div 
              key={key} 
              className={`flex flex-col py-3 px-2 rounded-lg border-b border-slate-100 last:border-0 transition-all duration-500 ${
                isUpdating ? 'bg-orange-50 border-l-2 border-l-orange-400 pl-3 translate-x-1 shadow-sm' : ''
              }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest mb-1 transition-colors ${
                isUpdating ? 'text-orange-600' : 'text-slate-400'
              }`}>
                {key}
              </span>
              <div className="text-sm min-h-[1.25rem]">
                {renderValue(value, key)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleDeleteVisitor = async (v, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Voulez-vous vraiment supprimer cet enregistrement définitivement ?")) {
      try {
        await deleteDoc(doc(db, 'live_visitors', v.id));
        
        if (v.visitorId) {
          try {
            await deleteDoc(doc(db, 'visitor_stats', v.visitorId));
          } catch (sErr) {
            console.warn("Erreur suppression stats:", sErr);
          }
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

  const handleDeleteAllVisitors = async () => {
    if (window.confirm("Voulez-vous vraiment supprimer TOUS les enregistrements d'historique ? Cette action est irréversible.")) {
      try {
        setLoading(true);
        const q = query(collection(db, 'live_visitors'));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        setSelectedVisitor(null);
        alert("Historique vidé avec succès.");
      } catch (err) {
        console.error("Erreur suppression totale:", err);
        alert("Erreur lors de la suppression massive.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
          <span className="relative flex h-3 w-3 sm:h-4 sm:w-4 mr-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-green-500"></span>
          </span>
          Visiteurs en Direct
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Liste des visiteurs - Masquée sur mobile si un visiteur est sélectionné */}
        <div className={`w-full lg:w-1/3 flex flex-col gap-4 ${selectedVisitor ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2 flex justify-between items-center">
              <span>Actifs en ce moment</span>
              <span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-bold">
                {activeVisitors.length}
              </span>
            </h2>
            <div className="space-y-3 max-h-[30vh] lg:max-h-64 overflow-y-auto pr-1">
              {activeVisitors.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">Aucun visiteur actif</p>
              ) : (
                activeVisitors.map(v => (
                  <button 
                    key={v.id} 
                    onClick={() => setSelectedVisitor(v)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${selectedVisitor?.id === v.id ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-100' : 'hover:bg-gray-50 border-gray-50'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-gray-800 truncate">{getVisitorIdentity(v)}</span>
                      <div className="flex items-center">
                        <span className="text-[10px] text-gray-400 mr-2">{formatRelativeTime(v.lastActiveAt)}</span>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded leading-none">
                        {v.formType || 'Général'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {v.userAgent ? v.userAgent.split(' ')[0].replace(/Mozilla\/[0-9.]+/g, '') : 'Inconnu'}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2 flex justify-between items-center">
              <span>Historique récent</span>
              <div className="flex items-center gap-3">
                {inactiveVisitors.length > 0 && (
                  <button 
                    onClick={handleDeleteAllVisitors}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-widest px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Vider tout
                  </button>
                )}
                <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-bold">
                  {inactiveVisitors.length}
                </span>
              </div>
            </h2>
            <div className="space-y-2 max-h-[40vh] lg:max-h-[400px] overflow-y-auto pr-1">
              {inactiveVisitors.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">Aucun historique récent</p>
              ) : (
                inactiveVisitors.map(v => (
                  <button 
                    key={v.id} 
                    onClick={() => setSelectedVisitor(v)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${selectedVisitor?.id === v.id ? 'bg-gray-100 border-gray-300 shadow-inner' : 'hover:bg-gray-50 border-gray-50'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="min-w-0 flex-1 mr-2">
                        <span className="font-semibold text-xs text-gray-700 truncate block">{getVisitorIdentity(v)}</span>
                        <div className="text-[10px] text-gray-400 mt-0.5 truncate">{v.formType || 'Page générale'}</div>
                      </div>
                      <div className="flex items-center shrink-0">
                        <span className="text-[10px] font-bold text-red-400 mr-2 uppercase tracking-tighter">PARTI</span>
                        <span className="text-[10px] text-gray-400 mr-2">{formatRelativeTime(v.lastActiveAt)}</span>
                        <button 
                          onClick={(e) => handleDeleteVisitor(v, e)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                          title="Supprimer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Détails en temps réel du visiteur sélectionné */}
        <div className={`w-full lg:w-2/3 bg-white rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-100 min-h-[500px] flex flex-col ${!selectedVisitor ? 'hidden lg:flex' : 'flex'}`}>
          {selectedVisitor ? (
            <div className="flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedVisitor(null)}
                    className="lg:hidden p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center truncate">
                      Session: <span className="font-mono ml-2 text-blue-600">{selectedVisitor.id.substring(0, 8)}</span>
                      {selectedVisitor.status === 'active' ? (
                        <span className="ml-3 relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                      ) : (
                        <span className="ml-3 text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-widest">
                          PARTI
                        </span>
                      )}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 uppercase tracking-widest font-bold">Page: {selectedVisitor.formType || 'Général'}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-1">Navigateur / Appareil</div>
                  <div className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate max-w-[200px] sm:max-w-xs">{selectedVisitor.userAgent}</div>
                </div>
              </div>

              {selectedVisitor.formData ? (
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 shadow-inner relative overflow-hidden border border-slate-200 flex-1">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
                    <svg className="w-48 h-48 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  </div>
                  
                  <div className="max-h-[60vh] lg:max-h-[500px] overflow-y-auto relative z-10 w-full scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pr-2">
                    <DataRenderer data={selectedVisitor.formData} />
                  </div>
                  
                  {selectedVisitor.status === 'active' && (
                    <div className="mt-6 flex items-center text-[10px] font-black uppercase text-orange-500 animate-pulse tracking-widest bg-orange-50 w-max px-3 py-1 rounded-full border border-orange-100">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2"></span>
                      Saisie en direct...
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <p className="text-gray-400 italic">Aucune donnée de formulaire capturée pour le moment...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Prêt pour le Tracking</h3>
              <p className="text-gray-400 max-w-xs">Sélectionnez un visiteur dans la liste de gauche pour voir ce qu'il tape en direct sur votre site.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
