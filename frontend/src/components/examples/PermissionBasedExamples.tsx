import React from 'react';
import { RoleGuard, useRoleCheck } from '@/components/auth/RoleGuard';

/**
 * Example component demonstrating permission-based access control patterns
 * This replaces and modernizes the role-based examples
 */
const PermissionBasedExamples: React.FC = () => {
  const { hasPermission } = useRoleCheck();

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Permission-Based Access Control Examples</h2>
      
      {/* Basic Permission Check */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Basic Permission-Based Rendering</h3>
        
        <RoleGuard permission="ADMIN_ACCESS">
          <div className="bg-red-100 p-3 rounded text-red-800">
            🔑 Admin-only content - Only administrators can see this
          </div>
        </RoleGuard>

        <RoleGuard permission="INSTRUCTOR_ACCESS">
          <div className="bg-blue-100 p-3 rounded text-blue-800 mt-2">
            👨‍🏫 Instructor content - Available to all instructors
          </div>
        </RoleGuard>

        <RoleGuard permission="VIEW_MANIFEST">
          <div className="bg-green-100 p-3 rounded text-green-800 mt-2">
            📋 Manifest view - Sport jumpers and above
          </div>
        </RoleGuard>
      </div>

      {/* Permission Check with Fallback */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Permission Checks with Fallback Content</h3>
        
        <RoleGuard 
          permission="CREATE_LOAD" 
          fallback={
            <div className="bg-yellow-100 p-3 rounded text-yellow-800">
              ⚠️ You need load creation permissions to create new loads
            </div>
          }
        >
          <div className="bg-green-100 p-3 rounded text-green-800">
            ✅ You can create loads
          </div>
        </RoleGuard>
      </div>

      {/* Conditional Logic with Hook */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Conditional Logic with Hook</h3>
        
        <div className="space-y-2">
          {hasPermission('MANAGE_USERS') && (
            <div className="bg-purple-100 p-3 rounded text-purple-800">
              👥 User Management Available
            </div>
          )}
          
          {hasPermission('APPROVE_JUMPS') && (
            <div className="bg-blue-100 p-3 rounded text-blue-800">
              ✅ Jump Approval Available
            </div>
          )}
          
          {hasPermission('MANAGE_MANIFEST') && (
            <div className="bg-indigo-100 p-3 rounded text-indigo-800">
              📝 Manifest Management Available
            </div>
          )}
        </div>
      </div>

      {/* Navigation Example */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Navigation Links Based on Permissions</h3>
        
        <nav className="space-x-4">
          <RoleGuard permission="VIEW_DASHBOARD">
            <a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a>
          </RoleGuard>
          
          <RoleGuard permission="VIEW_MANIFEST">
            <a href="/manifest" className="text-blue-600 hover:underline">Manifest</a>
          </RoleGuard>
          
          <RoleGuard permission="VIEW_LOADS">
            <a href="/loads" className="text-blue-600 hover:underline">Loads</a>
          </RoleGuard>
          
          <RoleGuard permission="VIEW_ADMIN_PANEL">
            <a href="/admin" className="text-blue-600 hover:underline">Admin Panel</a>
          </RoleGuard>
        </nav>
      </div>

      {/* Feature Buttons */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Feature Buttons</h3>
        
        <div className="space-x-2">
          <RoleGuard permission="CREATE_LOAD">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Create Load
            </button>
          </RoleGuard>
          
          <RoleGuard permission="MANAGE_AIRCRAFT">
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Manage Aircraft
            </button>
          </RoleGuard>
          
          <RoleGuard permission="APPROVE_JUMPS">
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Approve Jumps
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Page Protection Example */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Page Protection (Route Level)</h3>
        
        <RoleGuard 
          permission="VIEW_ADMIN_PANEL" 
          requireAuth={true}
          use404Fallback={true}
        >
          <div className="bg-red-100 p-3 rounded text-red-800">
            🔒 This would be an admin-only page
            <br />
            <small>Try this without admin permissions to see 404 behavior</small>
          </div>
        </RoleGuard>
      </div>
    </div>
  );
};

export default PermissionBasedExamples;
