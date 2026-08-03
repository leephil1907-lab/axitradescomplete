const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboardView.tsx', 'utf8');

const targetStr = `          )}
        </div>
      </div>

      {/* Custom Client Balance Adjustment Modal */}`;
      
code = code.replace(targetStr, `          )}

      {/* Custom Client Balance Adjustment Modal */}`);

fs.writeFileSync('src/components/AdminDashboardView.tsx', code);
