import React from 'react';
import { UserRole } from '@/types';
import { 
  RoleGuard, 
  AdminOnly, 
  InstructorOnly, 
  SportJumperOnly, 
  ExcludeNewUsers,
  useRoleCheck 
} from '@/components/auth/RoleGuard';

/**
 * Example component demonstrating various RBAC usage patterns
 * Following KISS principle - simple, clear examples
 */
const RoleBasedExamples: React.FC = () => {
  const { hasPermission, hasRole, hasAnyRole } = useRoleCheck();

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">RBAC Framework Examples</h2>
      
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
            👨‍🏫 Instructor content - Tandem/AFF instructors and admins can see this
          </div>
        </RoleGuard>
        
        <RoleGuard permission="VIEW_MANIFEST">
          <div className="bg-green-100 p-3 rounded text-green-800 mt-2">
            📋 Manifest access - Sport jumpers, instructors, and admins can see this
          </div>
        </RoleGuard>
      </div>

      {/* Specific Role Checks */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Specific Role-Based Rendering</h3>
        
        <RoleGuard role={UserRole.TANDEM_INSTRUCTOR}>
          <div className="bg-purple-100 p-3 rounded text-purple-800">
            🪂 Tandem Instructor only - Only tandem instructors can see this
          </div>
        </RoleGuard>
        
        <RoleGuard anyRole={[UserRole.SPORT_PAID, UserRole.SPORT_FREE]}>
          <div className="bg-yellow-100 p-3 rounded text-yellow-800 mt-2">
            🏃‍♂️ Sport Jumpers - Only paid/free sport jumpers can see this
          </div>
        </RoleGuard>
      </div>

      {/* Convenience Components */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Convenience Components</h3>
        
        <AdminOnly>
          <div className="bg-red-100 p-3 rounded text-red-800">
            👑 Admin Only Component - Simple admin check
          </div>
        </AdminOnly>
        
        <InstructorOnly>
          <div className="bg-blue-100 p-3 rounded text-blue-800 mt-2">
            🎓 Instructor Only Component - Any instructor
          </div>
        </InstructorOnly>
        
        <SportJumperOnly>
          <div className="bg-green-100 p-3 rounded text-green-800 mt-2">
            🏃‍♂️ Sport Jumper Only Component - AFF students and sport jumpers
          </div>
        </SportJumperOnly>
        
        <ExcludeNewUsers>
          <div className="bg-orange-100 p-3 rounded text-orange-800 mt-2">
            🚫 Exclude New Users - Everyone except tandem-only users
          </div>
        </ExcludeNewUsers>
      </div>

      {/* With Fallback Content */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">With Fallback Content</h3>
        
        <RoleGuard 
          permission="ADMIN_ACCESS"
          fallback={
            <div className="bg-gray-100 p-3 rounded text-gray-600">
              ℹ️ You need administrator privileges to see the admin content
            </div>
          }
        >
          <div className="bg-red-100 p-3 rounded text-red-800">
            🔑 Secret admin content here!
          </div>
        </RoleGuard>
      </div>

      {/* Hook Usage Examples */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Hook Usage in Component Logic</h3>
        
        <div className="space-y-2">
          <p>✅ Can view admin features: {hasPermission('ADMIN_ACCESS') ? 'Yes' : 'No'}</p>
          <p>✅ Is tandem instructor: {hasRole(UserRole.TANDEM_INSTRUCTOR) ? 'Yes' : 'No'}</p>
          <p>✅ Can access manifest: {hasPermission('VIEW_MANIFEST') ? 'Yes' : 'No'}</p>
          <p>✅ Is any instructor: {hasAnyRole([UserRole.TANDEM_INSTRUCTOR, UserRole.AFF_INSTRUCTOR]) ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Complex Conditional Rendering */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Complex Conditional Logic</h3>
        
        <div className="space-y-2">
          {hasPermission('ADMIN_ACCESS') && (
            <button className="bg-red-500 text-white px-4 py-2 rounded">
              Delete All Data (Admin Only)
            </button>
          )}
          
          {hasPermission('INSTRUCTOR_ACCESS') && (
            <button className="bg-blue-500 text-white px-4 py-2 rounded ml-2">
              Approve Manifest (Instructor)
            </button>
          )}
          
          {hasAnyRole([UserRole.SPORT_PAID, UserRole.SPORT_FREE]) && (
            <button className="bg-green-500 text-white px-4 py-2 rounded ml-2">
              Join Load (Sport Jumper)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleBasedExamples;
