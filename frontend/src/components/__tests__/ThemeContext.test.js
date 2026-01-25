/**
 * Тесты для ThemeContext
 * 
 * Для запуска: npm test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, ThemeContext } from '../../context/ThemeContext';

// Компонент-обертка для тестирования контекста
const TestComponent = () => {
  const { theme, toggleTheme } = React.useContext(ThemeContext);
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={toggleTheme} data-testid="toggle-button">
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Очищаем localStorage перед каждым тестом
    localStorage.clear();
  });

  test('должен использовать светлую тему по умолчанию', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeElement = screen.getByTestId('theme');
    expect(themeElement.textContent).toBe('light');
  });

  test('должен переключать тему при нажатии кнопки', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');
    const themeElement = screen.getByTestId('theme');

    // Начальная тема - light
    expect(themeElement.textContent).toBe('light');

    // Переключаем на dark
    fireEvent.click(toggleButton);
    expect(themeElement.textContent).toBe('dark');

    // Переключаем обратно на light
    fireEvent.click(toggleButton);
    expect(themeElement.textContent).toBe('light');
  });

  test('должен сохранять тему в localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');

    // Переключаем на dark
    fireEvent.click(toggleButton);
    expect(localStorage.getItem('theme')).toBe('dark');

    // Переключаем на light
    fireEvent.click(toggleButton);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('должен загружать сохраненную тему из localStorage', () => {
    // Устанавливаем темную тему в localStorage
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeElement = screen.getByTestId('theme');
    expect(themeElement.textContent).toBe('dark');
  });

  test('должен применять data-theme атрибут к document.documentElement', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');

    // Проверяем начальную тему
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Переключаем на dark
    fireEvent.click(toggleButton);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
