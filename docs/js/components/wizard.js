export class WizardController {
  constructor({ form, panels, indicators, nextButton, prevButton, summary }) {
    this.form = form;
    this.panels = panels;
    this.indicators = indicators;
    this.nextButton = nextButton;
    this.prevButton = prevButton;
    this.summary = summary;
    this.currentStep = 0;
  }

  init() {
    this.updateUI();
  }

  updateUI() {
    this.panels.forEach((panel, index) => {
      panel.classList.toggle('active', index === this.currentStep);
    });

    this.indicators.forEach((step, index) => {
      step.classList.toggle('active', index === this.currentStep);
    });

    const isFirstStep = this.currentStep === 0;
    const isLastStep = this.currentStep === this.panels.length - 1;

    this.prevButton.disabled = isFirstStep;
    this.prevButton.style.opacity = isFirstStep ? '0.5' : '1';
    this.nextButton.textContent = isLastStep ? 'Salvar' : 'Próximo';

    if (isLastStep) {
      const data = new FormData(this.form);
      const values = {
        empresa: data.get('empresa') || 'Não informado',
        obra: data.get('obra') || 'Não informado',
        status: data.get('status') || 'Não informado',
        tipoVistoria: data.get('tipoVistoria') || 'Não informado'
      };

      this.summary.innerHTML = `
        <strong>Empresa:</strong> ${values.empresa}<br>
        <strong>Obra:</strong> ${values.obra}<br>
        <strong>Status:</strong> ${values.status}<br>
        <strong>Vistoria:</strong> ${values.tipoVistoria}
      `;
    }
  }

  next() {
    if (this.currentStep < this.panels.length - 1) {
      this.currentStep += 1;
      this.updateUI();
      return;
    }

    const payload = Object.fromEntries(new FormData(this.form).entries());
    console.log('Cadastro finalizado:', payload);
    this.summary.innerHTML = '<strong>Cadastro concluído.</strong> Dados enviados para processamento.';
  }

  prev() {
    if (this.currentStep > 0) {
      this.currentStep -= 1;
      this.updateUI();
    }
  }
}
