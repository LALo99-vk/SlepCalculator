import { Routes, Route } from 'react-router-dom';
import QuotationsList from '../components/QuotationsList';
import QuotationForm from '../components/QuotationForm';

const Quotations: React.FC = () => {
  return (
    <Routes>
      <Route index element={<QuotationsList />} />
      <Route path="new" element={<QuotationForm />} />
      <Route path="edit/:id" element={<QuotationForm />} />
    </Routes>
  );
};

export default Quotations;