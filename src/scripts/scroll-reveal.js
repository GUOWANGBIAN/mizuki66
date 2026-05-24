// 滚动渐显动画脚本
document.addEventListener('DOMContentLoaded', function() {
  // 滚动渐显动画
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 观察所有带有 scroll-reveal 类的元素
  document.querySelectorAll('.scroll-reveal').forEach(el => {
    observer.observe(el);
  });

  // 为卡片添加悬停发光效果
  document.querySelectorAll('.card-base').forEach(card => {
    card.classList.add('card-glow');
  });

  // 为链接添加下划线动画
  document.querySelectorAll('a[href]').forEach(link => {
    if (!link.querySelector('img') && !link.classList.contains('btn-regular')) {
      link.classList.add('link-underline');
    }
  });
});
