// const Branch = require("../models").Branch;

// const generateBranchPasslock = async () => {
//     let passlock;
//     let exists = true;

//     while (exists) {
        
//         passlock = Math.floor(1000 + Math.random() * 9000).toString();

//         exists = await Branch.findOne({
//             where: { passlock },
//             attributes: ["id"]
//         });
//     }

//     return passlock;
// };

// module.exports = {
//     generateBranchPasslock
// };