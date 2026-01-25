/**
 * Тесты для компонента SellCar
 * 
 * Для запуска: npm test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import SellCar from '../SellCar';

// Мокаем axios
jest.mock('axios');

describe('SellCar Component', () => {
  beforeEach(() => {
    // Очищаем все моки перед каждым тестом
    jest.clearAllMocks();
  });

  test('должен отображать форму продажи автомобиля', () => {
    render(<SellCar />);

    expect(screen.getByText('Продать автомобиль')).toBeInTheDocument();
    expect(screen.getByLabelText(/Марка/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Модель/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Год выпуска/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Цена/i)).toBeInTheDocument();
  });

  test('должен показывать ошибку при отправке формы с пустыми обязательными полями', async () => {
    render(<SellCar />);

    const submitButton = screen.getByText('Разместить объявление');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/обязательные поля/i)).toBeInTheDocument();
    });
  });

  test('должен успешно отправить форму с валидными данными', async () => {
    const mockResponse = {
      data: {
        message: 'Объявление успешно создано',
        car: {
          id: 1,
          brand: 'Toyota',
          model: 'Camry',
          year: 2020,
          price: 5000000
        }
      }
    };

    axios.post.mockResolvedValue(mockResponse);

    render(<SellCar />);

    // Заполняем форму
    fireEvent.change(screen.getByLabelText(/Марка/i), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText(/Модель/i), { target: { value: 'Camry' } });
    fireEvent.change(screen.getByLabelText(/Год выпуска/i), { target: { value: '2020' } });
    fireEvent.change(screen.getByLabelText(/Цена/i), { target: { value: '5000000' } });

    // Отправляем форму
    const submitButton = screen.getByText('Разместить объявление');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/cars/sell',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/успешно создано/i)).toBeInTheDocument();
    });
  });

  test('должен показывать ошибку при невалидном годе', async () => {
    render(<SellCar />);

    fireEvent.change(screen.getByLabelText(/Марка/i), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText(/Модель/i), { target: { value: 'Camry' } });
    fireEvent.change(screen.getByLabelText(/Год выпуска/i), { target: { value: '1800' } });
    fireEvent.change(screen.getByLabelText(/Цена/i), { target: { value: '5000000' } });

    const submitButton = screen.getByText('Разместить объявление');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Год должен быть/i)).toBeInTheDocument();
    });
  });

  test('должен показывать ошибку при отрицательной цене', async () => {
    render(<SellCar />);

    fireEvent.change(screen.getByLabelText(/Марка/i), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText(/Модель/i), { target: { value: 'Camry' } });
    fireEvent.change(screen.getByLabelText(/Год выпуска/i), { target: { value: '2020' } });
    fireEvent.change(screen.getByLabelText(/Цена/i), { target: { value: '-1000' } });

    const submitButton = screen.getByText('Разместить объявление');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/положительным числом/i)).toBeInTheDocument();
    });
  });

  test('должен очищать форму после успешной отправки', async () => {
    const mockResponse = {
      data: {
        message: 'Объявление успешно создано',
        car: { id: 1 }
      }
    };

    axios.post.mockResolvedValue(mockResponse);

    render(<SellCar />);

    const brandInput = screen.getByLabelText(/Марка/i);
    fireEvent.change(brandInput, { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText(/Модель/i), { target: { value: 'Camry' } });
    fireEvent.change(screen.getByLabelText(/Год выпуска/i), { target: { value: '2020' } });
    fireEvent.change(screen.getByLabelText(/Цена/i), { target: { value: '5000000' } });

    const submitButton = screen.getByText('Разместить объявление');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(brandInput.value).toBe('');
    });
  });

  test('должен обрабатывать ошибки сервера', async () => {
    const errorResponse = {
      response: {
        data: {
          message: 'Ошибка создания объявления'
        }
      }
    };

    axios.post.mockRejectedValue(errorResponse);

    render(<SellCar />);

    fireEvent.change(screen.getByLabelText(/Марка/i), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText(/Модель/i), { target: { value: 'Camry' } });
    fireEvent.change(screen.getByLabelText(/Год выпуска/i), { target: { value: '2020' } });
    fireEvent.change(screen.getByLabelText(/Цена/i), { target: { value: '5000000' } });

    const submitButton = screen.getByText('Разместить объявление');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Ошибка создания объявления/i)).toBeInTheDocument();
    });
  });
});
