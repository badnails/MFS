// src/components/AccountSetupContainer.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PersonalAccountInfo from './PersonalAccountInfo';
import InstitutionalAccountInfo from './InstitutionalAccountInfo';
import ContactInfo from './ContactInfo';
import axios from 'axios';

const AccountSetupContainer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { accountType, accountid } = location.state || {};
  
  const isIndividual = accountType === 'PERSONAL' || accountType === 'AGENT';
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Collected data from all components
  const [collectedData, setCollectedData] = useState({
    personalData: null,
    institutionalData: null,
    contactData: null
  });

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(`accountSetup_${accountid}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setCollectedData(parsed.collectedData || collectedData);
      setCurrentStep(parsed.currentStep || 1);
    }
  }, [accountid]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = { collectedData, currentStep };
    localStorage.setItem(`accountSetup_${accountid}`, JSON.stringify(dataToSave));
  }, [collectedData, currentStep, accountid]);

  const handlePersonalDataSubmit = (formData) => {
    setCollectedData(prev => ({
      ...prev,
      personalData: formData
    }));
    setCurrentStep(2); // Move to contact info
  };

  const handleInstitutionalDataSubmit = (formData) => {
    setCollectedData(prev => ({
      ...prev,
      institutionalData: formData
    }));
    setCurrentStep(2); // Move to contact info
  };

const handleContactDataSubmit = async (formData) => {
  // First update the collected data
  const updatedCollectedData = {
    ...collectedData,
    contactData: formData
  };
  
  setCollectedData(updatedCollectedData);
  
  // Then submit all data to backend
  await submitAllData(updatedCollectedData);
};


  const submitAllData = async (allData) => {
    setLoading(true);
    
    try {
      const payload = {
        accountid,
        accountType,
        isIndividual,
        personalData: allData.personalData,
        institutionalData: allData.institutionalData,
        contactData: allData.contactData
      };

      const response = await axios.post('/auth/complete-account-setup', payload);

      if (response.status === 200) {
        // Clear saved data after successful submission
        localStorage.removeItem(`accountSetup_${accountid}`);
        
        navigate('/completion', {
          state: {
            accountid,
            accountType,
            message: 'Account setup completed successfully!'
          }
        });
      }
    } catch (error) {
      console.error('Failed to submit data:', error);
      // Handle error - maybe show error message
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  // Pass data and handlers to child components
// In AccountSetupContainer.jsx, update the childProps section:
const childProps = {
  accountType,
  accountid,
  onBack: handleBack,
  loading,
  existingData: (() => {
    if (currentStep === 1) {
      return isIndividual ? collectedData.personalData : collectedData.institutionalData;
    } else if (currentStep === 2) {
      return collectedData.contactData;
    }
    return null;
  })(),
  // You can also pass onDataChange if you wish to update state on every change
};



  return (
    <div>
      {currentStep === 1 && (
        <>
          {isIndividual ? (
            <PersonalAccountInfo
              {...childProps}
              onSubmit={handlePersonalDataSubmit}
            />
          ) : (
            <InstitutionalAccountInfo
              {...childProps}
              onSubmit={handleInstitutionalDataSubmit}
            />
          )}
        </>
      )}
      
      {currentStep === 2 && (
        <ContactInfo
          {...childProps}
          onSubmit={handleContactDataSubmit}
        />
      )}
    </div>
  );
};

export default AccountSetupContainer;
