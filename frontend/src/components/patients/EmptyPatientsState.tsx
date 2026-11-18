import React from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyPatientsStateProps {
  onAddPatient: () => void;
  isSearchEmpty?: boolean;
}

export const EmptyPatientsState: React.FC<EmptyPatientsStateProps> = ({
  onAddPatient,
  isSearchEmpty = false,
}) => {
  if (isSearchEmpty) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-purple-100 text-center my-6 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5b21b6] flex items-center justify-center mx-auto mb-4">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#1b122e] mb-1">
          No matching patients found
        </h3>
        <p className="text-xs text-[#6a5e80] max-w-sm mx-auto mb-4">
          No patients match your current search query. Try searching by another name or patient code.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-12 sm:p-16 border border-purple-100 text-center my-6 shadow-sm shadow-purple-950/5">
      <div className="w-16 h-16 rounded-2xl bg-purple-100/70 text-[#5b21b6] flex items-center justify-center mx-auto mb-4 shadow-xs">
        <Users className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-[#1b122e] mb-2">
        No patients yet
      </h3>
      <p className="text-xs sm:text-sm text-[#6a5e80] max-w-sm mx-auto mb-6">
        Add your first patient to start building a clinical record and querying guideline recommendations.
      </p>
      <Button
        onClick={onAddPatient}
        variant="primary"
        size="md"
        icon={<Plus className="w-4 h-4 ml-1" />}
      >
        Add Patient
      </Button>
    </div>
  );
};
