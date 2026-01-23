from setuptools import setup, find_packages

setup(
    name="termAi",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "numpy>=1.20.0",
    ],
    author="TermChat LT",
    description="Minimal AI library for TermChat LT",
    python_requires=">=3.7",
)