const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'music_guru_ui', 'src', 'components', 'findmyguru', 'ClassAdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Widening the modal
content = content.replace(
  'className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-gray-100 my-8"',
  'className="bg-white rounded-3xl max-w-[95vw] xl:max-w-7xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-gray-100 my-8"'
);

// Replacing the entire grid block
const gridStart = '<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 pt-2">';
const gridEnd = '</div>\n          </div>\n        </div>\n      )}\n\n      {/* Mock Checkout Modal Component */';

const startIndex = content.indexOf(gridStart);
const endIndex = content.indexOf(gridEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find the grid boundaries.");
  process.exit(1);
}

const replacement = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 pt-2">
              {plans
                .filter((p) => p.is_active !== false && p.isActive !== false)
                .sort((a, b) => getTierFromPlan(a) - getTierFromPlan(b))
                .map((planObj) => {
                  const tier = getTierFromPlan(planObj);
                  const isCurrent = currentPlanTier === tier && (!isPaidPlanActive ? tier === 1 && !currentIsExpired : isPaidPlanActive);
                  const isLowerTierDisabled = isPaidPlanActive && tier < currentPlanTier;

                  let theme = {
                    base: isCurrent ? 'border-gray-400 bg-slate-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white',
                    tierText: 'text-gray-500',
                    title: 'text-gray-900',
                    price: 'text-emerald-700',
                    btn: isCurrent ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : isLowerTierDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 text-white shadow'
                  };

                  if (tier === 2) theme = { ...theme, base: isCurrent ? 'border-indigo-600 bg-indigo-50/30 shadow-md' : 'border-indigo-200 hover:border-indigo-400 bg-white', tierText: 'text-indigo-600', price: 'text-indigo-900', btn: isCurrent ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 cursor-not-allowed' : isLowerTierDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' };
                  else if (tier === 3) theme = { ...theme, base: isCurrent ? 'border-purple-600 bg-purple-50/30 shadow-md' : 'border-purple-200 hover:border-purple-400 bg-white', tierText: 'text-purple-600', price: 'text-purple-900', btn: isCurrent ? 'bg-purple-100 text-purple-700 border border-purple-300 cursor-not-allowed' : isLowerTierDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md' };
                  else if (tier === 4) theme = { ...theme, base: isCurrent ? 'border-rose-500 bg-rose-50/40 shadow-md' : 'border-gray-200 hover:border-rose-500 bg-white hover:shadow-lg', tierText: 'text-gray-400', price: 'text-rose-900', btn: isCurrent ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed' : isLowerTierDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md' };
                  else if (tier === 5) theme = { ...theme, base: isCurrent ? 'border-amber-500 bg-amber-50/40 shadow-md' : 'border-amber-300 hover:border-amber-500 bg-white ring-2 ring-amber-400/20', tierText: 'text-amber-700', price: 'text-amber-900', btn: isCurrent ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed' : isLowerTierDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md' };

                  const parsedFeatures = (typeof planObj.features === 'string' ? planObj.features.split(',') : (Array.isArray(planObj.features) ? planObj.features : [])).map(f => String(f).trim()).filter(Boolean);

                  return (
                    <div key={planObj.id} className={\`p-5 rounded-2xl border-2 flex flex-col justify-between space-y-4 transition-all relative \${theme.base}\`}>
                      {tier === 5 && (
                        <span className="absolute -top-3 right-3 bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow uppercase tracking-wider">
                          ALL-IN-ONE
                        </span>
                      )}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={\`text-[10px] font-bold uppercase tracking-wider \${theme.tierText}\`}>Tier {tier}</span>
                          {isCurrent && (
                            <span className={\`text-[10px] font-extrabold px-2 py-0.5 rounded \${tier === 5 ? 'bg-amber-600 text-white' : tier === 4 ? 'bg-rose-100 text-rose-700' : tier === 3 ? 'bg-purple-600 text-white' : tier === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}\`}>Current</span>
                          )}
                        </div>
                        <h4 className={\`text-lg font-extrabold \${theme.title}\`}>{planObj.name}</h4>
                        
                        <div className="flex items-baseline space-x-2">
                          {planObj.price === 0 || !planObj.price ? (
                            <span className={\`text-2xl font-black \${theme.price}\`}>Lifetime Free</span>
                          ) : (
                            <div className={\`text-2xl font-black \${theme.price}\`}>
                              ₹{planObj.price} <span className="text-xs font-normal text-gray-500">/ year</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 leading-relaxed min-h-[3rem]">
                          {planObj.description || 'Includes basic directory listing.'}
                        </p>
                        
                        <ul className="space-y-2 text-[11px] text-gray-700 pt-3 border-t border-gray-100">
                          <li className="flex items-center gap-1.5 font-medium text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Directory Listing & Search</span>
                          </li>
                          <li className="flex items-center gap-1.5 font-medium text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Student Inquiry Forms</span>
                          </li>
                          {parsedFeatures.map((feat, i) => (
                            <li key={i} className="flex items-center gap-1.5 font-bold text-gray-800">
                              <CheckCircle2 className={\`w-3.5 h-3.5 shrink-0 \${tier === 5 ? 'text-amber-600' : tier === 4 ? 'text-rose-600' : tier === 3 ? 'text-purple-600' : 'text-indigo-600'}\`} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleOpenCheckout(planObj)}
                        disabled={isCurrent || isLowerTierDisabled}
                        className={\`w-full py-2.5 rounded-xl font-bold text-xs transition-all \${theme.btn}\`}
                      >
                        {isCurrent ? 'Active Plan' : (planObj.price === 0 ? 'Select Free Plan' : 'Activate Plan')}
                      </button>
                    </div>
                  );
                })}
            </div>
`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated modal!');
