import API from '../api.js';

/**
 * Checks if a merchant, receptionist, or salesperson account is active and permitted.
 * Endpoint: api/check_status_account
 * Request Payload:
 * {
 *   "user_type": 1, // 1 -> merchant, 2 -> receptionist, 4 -> salesperson
 *   "id": 25
 * }
 * Response Schema:
 * {
 *   "status": 1,
 *   "is_deleted": true,
 *   "is_status": true,
 *   "message": "This account is active."
 * }
 *
 * If any one of them is false, only allow the dashboard and restrict other pages and action buttons.
 *
 * @param {number} userType - 1 for merchant, 2 for receptionist, 4 for salesperson
 * @param {number|string} id - User/Account ID
 * @returns {Promise<{ isActive: boolean, isDeleted: boolean, isStatus: boolean, message: string, raw: any }>}
 */
export const checkAccountStatusApi = async (userType, id) => {
    if (!userType || !id) {
        return { isActive: true, isDeleted: true, isStatus: true, message: '' };
    }

    try {
        const payload = {
            user_type: Number(userType),
            id: Number(id)
        };

        let res = null;
        try {
            res = await API.post('api/check_status_account', payload);
        } catch (err1) {
            // Fallback in case endpoint is mounted without 'api/' prefix
            try {
                res = await API.post('check_status_account', payload);
            } catch (err2) {
                console.warn('check_status_account call failed:', err2?.message || err2);
                return { isActive: true, isDeleted: true, isStatus: true, message: '' };
            }
        }

        const data = res?.data;
        // console.log
        if (!data) {
            return { isActive: true, isDeleted: true, isStatus: true, message: '' };
        }

        // Rule: if any one of them is false, the account is restricted

        const isStatusOk = Number(data.status) === 1 || data.status === true;
        const isDeletedOk = data.is_deleted === true || data.is_deleted === 1 || data.is_deleted === 'true';
        const isStatusBoolOk = data.is_status === true || data.is_status === 1 || data.is_status === 'true';

        const isActive = Boolean(isStatusOk && isDeletedOk && isStatusBoolOk);
        const message = data.message || (isActive ? 'This account is active.' : 'This account is inactive or has been deactivated.');

        return {
            isActive,
            isDeleted: isDeletedOk,
            isStatus: isStatusBoolOk,
            status: data.status,
            message,
            raw: data
        };
    } catch (err) {
        console.error('Error checking account status:', err);
        return { isActive: true, isDeleted: true, isStatus: true, message: '' };
    }
};
