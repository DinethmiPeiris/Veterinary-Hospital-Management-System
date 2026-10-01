const fs = require('fs');
let content = fs.readFileSync('./frontend/src/pages/AdminDashboardPage.jsx', 'utf8');

const s2 = content.indexOf("{currentView === 'MANAGE_SCHEDULES' && (");
const e2 = content.indexOf("{currentView === 'VIEW_ALL_SCHEDULES' && (");

if (s2 !== -1 && e2 !== -1) {
    const viewBlock = content.substring(s2, e2);
    fs.writeFileSync('./frontend/src/pages/ManageSchedulesUI.txt', viewBlock);
    console.log('UI Block extracted: ' + viewBlock.length);
}
