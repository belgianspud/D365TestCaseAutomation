"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Test Case schemas
class TestStepBase(BaseModel):
    type: str  # navigate, click, fill, verify, wait, condition, break_if, loop_until
    selector: Optional[str] = None
    value: Optional[str] = None
    expected: Optional[str] = None
    timeout: Optional[int] = 5000
    description: Optional[str] = None
    # Conditional logic fields
    condition_type: Optional[str] = None  # exists, not_exists, text_contains, text_equals, visible, not_visible
    condition_selector: Optional[str] = None
    condition_value: Optional[str] = None
    break_on_condition: Optional[bool] = None  # True = pass, False = fail
    max_attempts: Optional[int] = None  # For loop_until steps
    on_failure: Optional[str] = None  # continue, break_pass, break_fail

class TestCaseBase(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[TestStepBase]
    expected_result: str = "pass"
    tags: Optional[str] = None

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[TestStepBase]] = None
    expected_result: Optional[str] = None
    tags: Optional[str] = None
    is_active: Optional[bool] = None

class TestCase(TestCaseBase):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Test Run schemas
class TestRunCreate(BaseModel):
    test_case_id: int
    environment_url: Optional[str] = None

class TestRun(BaseModel):
    id: int
    test_case_id: int
    user_id: int
    status: str
    result: Optional[str] = None
    execution_time: Optional[float] = None
    screenshot_path: Optional[str] = None
    trace_path: Optional[str] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Test Suite schemas
class TestSuiteBase(BaseModel):
    name: str
    description: Optional[str] = None
    test_case_ids: List[int]

class TestSuiteCreate(TestSuiteBase):
    pass

class TestSuite(TestSuiteBase):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Environment schemas
class EnvironmentBase(BaseModel):
    name: str
    url: str
    description: Optional[str] = None

class EnvironmentCreate(EnvironmentBase):
    pass

class Environment(EnvironmentBase):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Response schemas
class MessageResponse(BaseModel):
    message: str

class TestRunResult(BaseModel):
    run_id: int
    status: str
    execution_time: Optional[float] = None
    result: Optional[str] = None
    error_message: Optional[str] = None
