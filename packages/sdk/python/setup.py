from setuptools import setup, find_packages

setup(
    name="burnerpoint",
    version="1.0.0",
    description="Official BurnerPoint Python SDK",
    author="BurnerPoint",
    author_email="developers@burnerpoint.app",
    url="https://github.com/burnerpoint/sdk-python",
    packages=find_packages(),
    install_requires=["httpx>=0.27.0"],
    python_requires=">=3.9",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
)
