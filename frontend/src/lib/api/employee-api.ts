import { apiClient } from '../api-client';

export interface EmployeeProfile {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    workEmail?: string;
    employeeNumber?: string;
    departmentId?: string;
    positionId?: string;
    systemRoles?: string[]; // Added to match backend response
}

export const employeeApi = {
    async searchEmployees(query: string = ''): Promise<EmployeeProfile[]> {
        const response = await apiClient.get<EmployeeProfile[]>('/employee-profile/admin/search', {
            params: { q: query }
        });
        return response.data;
    },
    async getEmployeeById(id: string): Promise<EmployeeProfile> {
        const response = await apiClient.get<EmployeeProfile>(`/employee-profile/${id}`);
        return response.data;
    },
};
